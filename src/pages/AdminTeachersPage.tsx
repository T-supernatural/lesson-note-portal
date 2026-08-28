import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { fetchTeachers, inviteTeachers, updateTeacherProfile, type TeacherInvite } from "../services/profiles";
import type { Profile } from "../types";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import toast from "react-hot-toast";
import NavigationShell from "../components/NavigationShell";
import LoadingState from "../components/LoadingState";
import InlineError from "../components/InlineError";

type TeacherForm = Pick<
  Profile,
  "full_name" | "email" | "subject" | "is_active"
>;

type TeacherRowProps = {
  teacher: Profile;
  saving: boolean;
  onSave: (values: TeacherForm) => Promise<void>;
};

const TeacherRow = ({ teacher, saving, onSave }: TeacherRowProps) => {
  const { register, handleSubmit } = useForm<TeacherForm>({
    defaultValues: {
      full_name: teacher.full_name,
      email: teacher.email,
      subject: teacher.subject || "",
      is_active: teacher.is_active,
    },
  });

  return (
    <form
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft"
      onSubmit={handleSubmit(onSave)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Full name
          <Input {...register("full_name", { required: true })} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Email from Supabase Auth
          <Input type="email" {...register("email", { required: true })} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Subject
          <Input {...register("subject")} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Access
          <Select
            {...register("is_active", {
              setValueAs: (value) => value === "active",
            })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">
          Auth user ID: {teacher.id}
        </span>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
};

const AdminTeachersPage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteText, setInviteText] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchTeachers()
      .then(setTeachers)
      .catch(() => {
        setError("Unable to load teachers.");
        toast.error("Unable to load teachers");
      })
      .finally(() => setLoading(false));
  }, [profile]);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teachers;
    return teachers.filter((teacher) =>
      [teacher.full_name, teacher.email, teacher.subject || ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, teachers]);

  const saveTeacher = async (teacherId: string, values: TeacherForm) => {
    const confirmed = window.confirm(
      `Save these changes for ${values.full_name || "this teacher"}?\n\nEmail: ${values.email}\nSubject: ${values.subject || "Not assigned"}\nAccess: ${values.is_active ? "Active" : "Inactive"}`,
    );
    if (!confirmed) return;
    setSavingId(teacherId);
    try {
      const updated = await updateTeacherProfile(teacherId, values);
      setTeachers((current) =>
        current.map((teacher) =>
          teacher.id === teacherId ? updated : teacher,
        ),
      );
      toast.success("Teacher profile updated");
    } catch (error: any) {
      toast.error(error?.message || "Unable to update teacher profile");
    } finally {
      setSavingId(null);
    }
  };

  const parseInvites = (value: string): TeacherInvite[] => value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("email,"))
    .map((line) => {
      const [email, fullName, subject] = line.split(",").map((part) => part.trim());
      return { email, full_name: fullName || undefined, subject: subject || undefined };
    });

  const sendInvites = async () => {
    const invites = parseInvites(inviteText);
    if (!invites.length) {
      toast.error("Enter at least one email address.");
      return;
    }
    if (invites.length > 100) {
      toast.error("Send no more than 100 invitations at a time.");
      return;
    }
    if (!invites.every((invite) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email))) {
      toast.error("Check that every invitation has a valid email address.");
      return;
    }
    if (!window.confirm(`Send ${invites.length} invitation${invites.length === 1 ? "" : "s"} with a direct password setup link?`)) return;
    setInviting(true);
    try {
      const result = await inviteTeachers(invites);
      setInviteText("");
      toast.success(`${result.invited.length} invitation${result.invited.length === 1 ? "" : "s"} sent`);
      if (result.failed.length) toast.error(`${result.failed.length} invitation${result.failed.length === 1 ? "" : "s"} could not be sent`);
    } catch (inviteError: any) {
      toast.error(inviteError?.message || "Unable to send invitations");
    } finally {
      setInviting(false);
    }
  };

  const loadTeachers = () => {
    setError(null);
    setLoading(true);
    fetchTeachers()
      .then(setTeachers)
      .catch(() => setError("Unable to load teachers."))
      .finally(() => setLoading(false));
  };

  return (
    <NavigationShell role="admin">
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Teacher management
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Update teacher profiles and control portal access.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/admin")}>Dashboard</Button>
              <Button variant="secondary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
          <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
            <PageHeader
              title={`${teachers.length} teachers`}
              description="Search by name, email, or subject. Account creation and password changes remain managed in Supabase Auth."
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teachers"
              aria-label="Search teachers"
            />
          </div>
          <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
            <PageHeader
              title="Invite teachers"
              description="Paste one email per line, or use email, full name, subject. Invitations open directly to password setup."
            />
            <textarea
              value={inviteText}
              onChange={(event) => setInviteText(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-sky-200"
              placeholder={'teacher@example.com\nteacher2@example.com, Jane Smith, Mathematics'}
              aria-label="Teacher invitation list"
            />
            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={() => void sendInvites()} disabled={inviting}>
                {inviting ? "Sending…" : "Send invitations"}
              </Button>
            </div>
          </div>
          {error ? (
            <InlineError message={error} onRetry={loadTeachers} />
          ) : loading ? (
            <LoadingState label="Loading teachers..." />
          ) : filteredTeachers.length === 0 ? (
            <EmptyState
              title="No teachers found"
              subtitle="Try a different search."
            />
          ) : (
            <div className="grid gap-4">
              {filteredTeachers.map((teacher) => (
                <TeacherRow
                  key={teacher.id}
                  teacher={teacher}
                  saving={savingId === teacher.id}
                  onSave={(values) => saveTeacher(teacher.id, values)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </NavigationShell>
  );
};

export default AdminTeachersPage;
