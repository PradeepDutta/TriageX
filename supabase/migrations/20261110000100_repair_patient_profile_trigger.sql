-- Restore the profile-to-auth relationship if it is missing, then reinstall
-- the patient-only auth trigger. Existing profiles and their roles are kept.
do $$
declare
  profile_id_attnum smallint;
  auth_id_attnum smallint;
  has_expected_foreign_key boolean;
  has_conflicting_foreign_key boolean;
begin
  select attnum
    into profile_id_attnum
    from pg_attribute
   where attrelid = 'public.profiles'::regclass
     and attname = 'id'
     and not attisdropped;

  select attnum
    into auth_id_attnum
    from pg_attribute
   where attrelid = 'auth.users'::regclass
     and attname = 'id'
     and not attisdropped;

  if profile_id_attnum is null or auth_id_attnum is null then
    raise exception 'Expected public.profiles.id and auth.users.id columns were not found';
  end if;

  select exists (
    select 1
      from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and contype = 'f'
       and conkey = array[profile_id_attnum]::smallint[]
       and confrelid = 'auth.users'::regclass
       and confkey = array[auth_id_attnum]::smallint[]
  )
    into has_expected_foreign_key;

  select exists (
    select 1
      from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and contype = 'f'
       and profile_id_attnum = any(conkey)
  )
    into has_conflicting_foreign_key;

  if has_conflicting_foreign_key and not has_expected_foreign_key then
    raise exception 'public.profiles.id has a foreign key to an unexpected relation; inspect it before changing the schema';
  end if;

  if not has_expected_foreign_key then
    alter table public.profiles
      add constraint triagex_profiles_auth_user_id_fkey
      foreign key (id) references auth.users (id)
      on delete cascade
      not valid;

    alter table public.profiles
      validate constraint triagex_profiles_auth_user_id_fkey;
  end if;
end;
$$;

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
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();
