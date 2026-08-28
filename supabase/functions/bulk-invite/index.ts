import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TeacherInvite = {
  email: string;
  full_name?: string;
  subject?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Function is not configured" }, 500);

  const accessToken = authorization.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Not authenticated" }, 401);

  const { data: adminProfile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profileError || adminProfile?.role !== "admin") return json({ error: "Admin access required" }, 403);

  let body: { teachers?: TeacherInvite[]; redirectTo?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const teachers = body.teachers;
  if (!Array.isArray(teachers) || teachers.length === 0 || teachers.length > 100) {
    return json({ error: "Provide between 1 and 100 teachers" }, 400);
  }

  const configuredAppUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "");
  const redirectTo = configuredAppUrl ? `${configuredAppUrl}/reset-password` : body.redirectTo;
  if (!redirectTo) return json({ error: "Function is not configured with APP_URL" }, 500);
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const invited: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  for (const teacher of teachers) {
    const email = teacher.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      failed.push({ email: teacher.email || "", error: "Invalid email address" });
      continue;
    }

    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: teacher.full_name?.trim() || "New User",
        subject: teacher.subject?.trim() || null,
      },
    });
    if (error) failed.push({ email, error: error.message });
    else invited.push(email);
  }

  return json({ invited, failed });
});
