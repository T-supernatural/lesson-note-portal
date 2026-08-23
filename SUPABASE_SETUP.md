# Supabase Setup for a New Project

This guide reconnects the lesson portal to a new Supabase project.

## 1. Create the project

1. Create the official Supabase project.
2. Record the project URL and the public anon key from **Project Settings > API**.
3. Keep database and Auth access restricted to the official project team.

The anon key is intended for browser use, but it is only safe when Row Level Security policies are enabled. Never put a service-role key in this project or in a `VITE_` variable.

## 2. Run the database setup

1. Open **SQL Editor** in the new Supabase project.
2. Open `db/schema.sql` from this repository.
3. Run the complete file once.
4. Confirm that `profiles`, `lesson_notes`, and the `lesson-content` Storage bucket exist.

The script creates the tables, enables RLS, creates the role policies, and provisions the public read/authenticated upload policy required by the current rich-text editor.

It also adds `academic_session` and `lesson_day` to lesson notes. Existing rows are assigned `2025/26` and `Unspecified` so the migration does not lose or hide the previous session. New notes created by the app default to `2026/27` and require a lesson day.

## 3. Configure Auth

In **Authentication > URL Configuration**:

- Set **Site URL** to the production Netlify URL.
- Add the production URL followed by `/reset-password` to **Redirect URLs**.
- Add the local URL followed by `/reset-password` while developing, for example `http://localhost:4173/reset-password`.

Create users in **Authentication > Users**. For every Auth user, insert a matching profile row using that user's UUID:

```sql
insert into public.profiles (id, full_name, email, role, subject)
values ('AUTH_USER_UUID', 'Teacher Name', 'teacher@example.com', 'teacher', 'Mathematics');
```

For the administrator, use `role = 'admin'`:

```sql
insert into public.profiles (id, full_name, email, role, subject)
values ('AUTH_ADMIN_UUID', 'Head of Academics', 'admin@example.com', 'admin', null);
```

Do not use the example UUIDs in `db/seed.sql` unless they are replaced with real Auth user IDs.

## 4. Connect the local app

Copy `.env.example` to `.env` and fill in values from the new project:

```dotenv
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_KEY"
VITE_GEMINI_MODEL="gemini-2.5-flash"
```

The current AI implementation also expects `VITE_GEMINI_API_KEY`, but that key is exposed in the browser and should not be used for the protected production setup. Before enabling AI again, move Gemini calls to a server-side endpoint or Supabase Edge Function. Rotate any previously exposed Gemini key.

The repository now includes the server-side function at `supabase/functions/generate-lesson-note`.

## 5. Deploy the AI function

Install and authenticate the Supabase CLI, then run these commands from the repository root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_NEW_GEMINI_API_KEY
supabase functions deploy generate-lesson-note
```

The function uses the authenticated Supabase session sent by the app. Do not add `GEMINI_API_KEY` to `.env`, Netlify, or any `VITE_` variable.

## 6. Configure Netlify

In the Netlify site settings, add the same Supabase URL and anon key as environment variables for the deploy context:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not upload `.env` or commit it. The repository `.gitignore` already excludes it.

## 7. Verify the connection

Run locally:

```bash
npm install
npm run build
npm run dev
```

Then verify:

1. A teacher can sign in.
2. The teacher can create and save a draft.
3. The teacher can submit a note.
4. An admin can sign in and see the submitted note.
5. The admin can approve or reject it.
6. A rejected note can be edited and resubmitted.
7. Rich-text image upload works in the `lesson-content` bucket.
8. Password reset redirects back to `/reset-password`.
9. AI generation works after the Edge Function is deployed.

## Security note

The current Storage policy permits any authenticated user to upload to `lesson-content`, and the bucket is public so inserted image links can render in notes. This is compatible with the current app, but it should be tightened in the security upgrade phase with user-scoped paths, file-size/type limits, and controlled access.
