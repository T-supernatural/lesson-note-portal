# RealJoy Schools - Digital Lesson Note Portal

A simple React + Vite portal for teachers to draft and submit lesson notes, and for admins to review and approve.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your Supabase values.
3. Run development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a Supabase project.
2. Open SQL editor and run the statements in `db/schema.sql`.
3. Create user accounts in Supabase Auth for admin and teachers.
4. Insert matching rows into `profiles` using `db/seed.sql` or custom SQL.
5. In Supabase Settings, make sure RLS is enabled and policies are active.
6. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

## Migration Steps (if upgrading existing project)

If you have an existing Supabase project with the old schema:

1. Run the updated `db/schema.sql` in Supabase SQL editor to add the `is_admin` function and update policies.
2. Drop the old recursive policies if they exist:
   ```sql
   drop policy if exists profiles_select_admin on profiles;
   drop policy if exists lesson_notes_select_admin on lesson_notes;
   drop policy if exists lesson_notes_update_admin on lesson_notes;
   ```
3. The new policies will be created by running the schema.

## Seed Admin Account

1. Create an admin user in Supabase Auth with email and password.
2. Copy the new user `id` from Supabase Auth.
3. Insert a profile row in `profiles`:
   ```sql
   insert into profiles (id, full_name, email, role, subject)
   values ('<ADMIN_USER_ID>', 'Head of Academics', 'admin@realjoy.sch', 'admin', null);
   ```
4. Create teacher users and insert matching `profiles` rows with `role = 'teacher'` and a `subject`.

## Deployment

Build and preview locally:
```bash
npm run build
npm run preview
```

Deploy to any static host that supports Vite builds, or use Supabase Hosting with the generated `dist` folder.
