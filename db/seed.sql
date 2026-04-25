-- Seed guidance for Supabase
-- 1. Create users in Supabase Auth with email/password.
-- 2. Insert matching profiles row for each user.

-- Example admin profile. Replace the UUID with the auth user ID from Supabase Auth.
insert into profiles (id, full_name, email, role, subject)
values
  ('00000000-0000-0000-0000-000000000001', 'Head of Academics', 'admin@realjoy.sch', 'admin', null);

-- Example teacher profile.
insert into profiles (id, full_name, email, role, subject)
values
  ('00000000-0000-0000-0000-000000000002', 'Grace Teacher', 'teacher1@realjoy.sch', 'teacher', 'Mathematics');

-- After creating profiles, teachers can create lesson notes through the app.
