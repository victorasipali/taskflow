-- Sample data for the marker's test account (brief §11.7: "an empty application cannot be assessed").
--
-- 1. Register the test account in the app (or Dashboard → Authentication → Add user),
--    and confirm its email.
-- 2. Change the email below to that account's email.
-- 3. Run this file in the SQL Editor. It runs as the postgres role, which bypasses RLS,
--    so user_id is set explicitly. Re-running it adds a second copy.

do $$
declare
  test_user uuid;
  p_uni     uuid;
  p_home    uuid;
  p_side    uuid;
begin
  select id into test_user from auth.users where email = 'victorasipali@gmail.com';
  if test_user is null then
    raise exception 'No user with that email — register it first, then edit this file.';
  end if;

  insert into public.projects (user_id, name, description, color)
  values (test_user, 'IS323 Semester Project', 'Mobile app milestones and build tasks', '#3F51B5')
  returning id into p_uni;

  insert into public.projects (user_id, name, description, color)
  values (test_user, 'Home', 'Errands and chores', '#00897B')
  returning id into p_home;

  insert into public.projects (user_id, name, description, color)
  values (test_user, 'Coding channel', 'Ideas and posts for the blog', '#F4511E')
  returning id into p_side;

  insert into public.tasks (user_id, project_id, title, notes, status, priority, due_at, remind) values
    (test_user, p_uni,  'Write technical report reflection', '500–800 words: what broke, what I cut, what I learned.', 'in_progress', 'high',   now() + interval '3 hours', true),
    (test_user, p_uni,  'Run EAS preview build and install APK', 'eas build --platform android --profile preview', 'todo', 'high', now() + interval '1 day', true),
    (test_user, p_uni,  'Record 5–7 min demo video from the APK', 'Include aeroplane-mode error case on camera.', 'todo', 'medium', now() + interval '5 days', false),
    (test_user, p_uni,  'Draw data model diagram', null, 'done', 'medium', now() - interval '6 days', false),
    (test_user, p_uni,  'Fix RLS policy on tasks table', 'Check with a second test account.', 'todo', 'high', now() - interval '1 day', false),
    (test_user, p_home, 'Buy groceries at the market', 'Kaukau, greens, rice, tinned fish', 'todo', 'low', now() + interval '5 hours', false),
    (test_user, p_home, 'Pay electricity token', null, 'done', 'medium', now() - interval '2 days', false),
    (test_user, p_home, 'Wash school uniform', null, 'todo', 'low', null, false),
    (test_user, p_side, 'Draft post: Expo Go vs dev builds', null, 'todo', 'medium', now() + interval '4 days', false),
    (test_user, p_side, 'Record screen capture of Supabase RLS demo', null, 'in_progress', 'low', null, false);
end $$;
