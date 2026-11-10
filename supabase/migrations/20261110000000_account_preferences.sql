create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role text not null default 'patient' check (role in ('patient', 'clinician', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'patient'
  );
  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  appearance text not null default 'system' check (appearance in ('light', 'dark', 'system')),
  language text not null default 'en' check (language in ('en', 'hi', 'od', 'bn', 'te', 'ta', 'mr', 'gu', 'pa', 'ur', 'kn', 'ml', 'as')),
  notifications jsonb not null default '{"healthReminders":false,"appointmentUpdates":false,"triageUpdates":true}'::jsonb,
  font_size text not null default 'standard' check (font_size in ('standard', 'large')),
  high_contrast boolean not null default false,
  reduced_motion boolean not null default false,
  speech_language text not null default 'en' check (speech_language in ('en', 'hi', 'od', 'bn', 'te', 'ta', 'mr', 'gu', 'pa', 'ur', 'kn', 'ml', 'as')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
revoke all on public.user_preferences from anon, authenticated;
grant select, insert, update on public.user_preferences to authenticated;

create policy "Users can read their own preferences"
  on public.user_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_type text not null check (request_type in ('account_deletion')),
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'completed', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.privacy_requests enable row level security;
revoke all on public.privacy_requests from anon, authenticated;
grant select, insert on public.privacy_requests to authenticated;

create policy "Users can submit their own privacy requests"
  on public.privacy_requests for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can read their own privacy requests"
  on public.privacy_requests for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- New accounts are always patients. Promote a clinician/admin only from the
-- trusted Supabase SQL editor after verifying their identity and authorization.
