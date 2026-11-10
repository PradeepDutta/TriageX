-- Add tenant identity and authorization foundations without changing existing
-- profiles, users, roles, preferences, or demo triage data.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'onboarding'
    check (status in ('onboarding', 'active', 'suspended')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'onboarding'
    check (status in ('onboarding', 'active', 'suspended')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (organization_id, id)
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  code text not null check (code ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$'),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, code),
  unique (hospital_id, id)
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  role text not null check (role in ('organization_admin')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'revoked')),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, role),
  unique (id, organization_id)
);

create table if not exists public.hospital_memberships (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'revoked')),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, user_id),
  unique (id, hospital_id)
);

create table if not exists public.hospital_role_grants (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null,
  hospital_id uuid not null,
  department_id uuid,
  role text not null check (
    role in ('hospital_admin', 'department_manager', 'doctor', 'nurse', 'triage_staff', 'receptionist')
  ),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  foreign key (membership_id, hospital_id)
    references public.hospital_memberships (id, hospital_id) on delete restrict,
  foreign key (hospital_id, department_id)
    references public.departments (hospital_id, id) on delete restrict,
  check (revoked_at is null or revoked_at >= granted_at),
  check (role <> 'hospital_admin' or department_id is null),
  check (role <> 'department_manager' or department_id is not null)
);

create unique index if not exists hospital_role_grants_active_department_unique
  on public.hospital_role_grants (membership_id, role, department_id)
  where revoked_at is null and department_id is not null;

create unique index if not exists hospital_role_grants_active_hospital_unique
  on public.hospital_role_grants (membership_id, role)
  where revoked_at is null and department_id is null;

create table if not exists public.platform_role_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  role text not null check (role in ('platform_super_admin')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= granted_at)
);

create unique index if not exists platform_role_grants_active_unique
  on public.platform_role_grants (user_id, role)
  where revoked_at is null;

create table if not exists public.tenant_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  resource_type text not null,
  resource_id uuid not null,
  organization_id uuid,
  hospital_id uuid,
  subject_user_id uuid references auth.users (id) on delete set null,
  role text,
  occurred_at timestamptz not null default now()
);

create index if not exists organization_memberships_user_status_idx
  on public.organization_memberships (user_id, status, organization_id);
create index if not exists hospital_memberships_user_status_idx
  on public.hospital_memberships (user_id, status, hospital_id);
create index if not exists hospital_role_grants_membership_active_idx
  on public.hospital_role_grants (membership_id, role, department_id)
  where revoked_at is null;
create index if not exists departments_hospital_status_idx
  on public.departments (hospital_id, status);
create index if not exists tenant_audit_logs_organization_time_idx
  on public.tenant_audit_logs (organization_id, occurred_at desc);
create index if not exists tenant_audit_logs_hospital_time_idx
  on public.tenant_audit_logs (hospital_id, occurred_at desc);

alter table public.organizations enable row level security;
alter table public.hospitals enable row level security;
alter table public.departments enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.hospital_memberships enable row level security;
alter table public.hospital_role_grants enable row level security;
alter table public.platform_role_grants enable row level security;
alter table public.tenant_audit_logs enable row level security;

revoke all on public.organizations, public.hospitals, public.departments,
  public.organization_memberships, public.hospital_memberships,
  public.hospital_role_grants, public.platform_role_grants,
  public.tenant_audit_logs from public, anon, authenticated;

grant select on public.organizations, public.hospitals, public.departments,
  public.organization_memberships, public.hospital_memberships,
  public.hospital_role_grants, public.platform_role_grants,
  public.tenant_audit_logs to authenticated;

create or replace function public.is_platform_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.platform_role_grants prg
     where prg.user_id = (select auth.uid())
       and prg.role = 'platform_super_admin'
       and prg.revoked_at is null
  );
$$;

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.organization_memberships om
      join public.organizations o on o.id = om.organization_id
     where om.organization_id = target_organization_id
       and om.user_id = (select auth.uid())
       and om.status = 'active'
       and o.status = 'active'
       and om.role = any(coalesce(allowed_roles, array[]::text[]))
  );
$$;

create or replace function public.has_hospital_role(
  target_hospital_id uuid,
  allowed_roles text[],
  target_department_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.hospital_memberships hm
      join public.hospitals h on h.id = hm.hospital_id
      join public.organizations o on o.id = h.organization_id
      join public.hospital_role_grants hrg on hrg.membership_id = hm.id
     where hm.user_id = (select auth.uid())
       and hm.hospital_id = target_hospital_id
       and hm.status = 'active'
       and h.status = 'active'
       and o.status = 'active'
       and hrg.revoked_at is null
       and hrg.role = any(coalesce(allowed_roles, array[]::text[]))
       and (
         hrg.department_id is null
         or (
           target_department_id is not null
           and hrg.department_id = target_department_id
           and exists (
             select 1
               from public.departments d
              where d.id = target_department_id
                and d.hospital_id = target_hospital_id
                and d.status = 'active'
           )
         )
       )
  );
$$;

create or replace function public.can_access_department(target_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_super_admin()
      or exists (
        select 1
          from public.departments d
          join public.hospitals h on h.id = d.hospital_id
          join public.organizations o on o.id = h.organization_id
         where d.id = target_department_id
           and d.status = 'active'
           and h.status = 'active'
           and o.status = 'active'
           and (
             public.has_organization_role(h.organization_id, array['organization_admin']::text[])
             or public.has_hospital_role(
               h.id,
               array['hospital_admin', 'department_manager', 'doctor', 'nurse', 'triage_staff', 'receptionist']::text[],
               d.id
             )
           )
      );
$$;

create or replace function public.can_access_hospital(target_hospital_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_super_admin()
      or exists (
        select 1
          from public.hospitals h
         where h.id = target_hospital_id
           and h.status = 'active'
           and exists (
             select 1
               from public.organizations o
              where o.id = h.organization_id
                and o.status = 'active'
           )
           and public.has_organization_role(h.organization_id, array['organization_admin']::text[])
      )
      or exists (
        select 1
          from public.hospital_memberships hm
          join public.hospitals h on h.id = hm.hospital_id
          join public.organizations o on o.id = h.organization_id
          join public.hospital_role_grants hrg on hrg.membership_id = hm.id
         where hm.user_id = (select auth.uid())
           and hm.hospital_id = target_hospital_id
           and hm.status = 'active'
           and h.status = 'active'
           and o.status = 'active'
           and hrg.revoked_at is null
      );
$$;

revoke all on function public.is_platform_super_admin() from public, anon;
revoke all on function public.has_organization_role(uuid, text[]) from public, anon;
revoke all on function public.has_hospital_role(uuid, text[], uuid) from public, anon;
revoke all on function public.can_access_department(uuid) from public, anon;
revoke all on function public.can_access_hospital(uuid) from public, anon;
grant execute on function public.is_platform_super_admin() to authenticated;
grant execute on function public.has_organization_role(uuid, text[]) to authenticated;
grant execute on function public.has_hospital_role(uuid, text[], uuid) to authenticated;
grant execute on function public.can_access_department(uuid) to authenticated;
grant execute on function public.can_access_hospital(uuid) to authenticated;

create policy "Tenant members can read their organizations"
  on public.organizations for select
  to authenticated
  using (
    public.is_platform_super_admin()
    or public.has_organization_role(id, array['organization_admin']::text[])
  );

create policy "Authorized members can read their hospitals"
  on public.hospitals for select
  to authenticated
  using (public.can_access_hospital(id));

create policy "Authorized members can read their departments"
  on public.departments for select
  to authenticated
  using (public.can_access_department(id));

create policy "Users and tenant admins can read organization memberships"
  on public.organization_memberships for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_platform_super_admin()
    or public.has_organization_role(organization_id, array['organization_admin']::text[])
  );

create policy "Users and hospital admins can read hospital memberships"
  on public.hospital_memberships for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_platform_super_admin()
    or public.has_organization_role(
      (select h.organization_id from public.hospitals h where h.id = hospital_id),
      array['organization_admin']::text[]
    )
    or public.has_hospital_role(hospital_id, array['hospital_admin']::text[])
  );

create policy "Users and hospital admins can read hospital role grants"
  on public.hospital_role_grants for select
  to authenticated
  using (
    exists (
      select 1
        from public.hospital_memberships hm
       where hm.id = membership_id
         and hm.user_id = (select auth.uid())
    )
    or public.is_platform_super_admin()
    or public.has_organization_role(
      (select h.organization_id from public.hospitals h where h.id = hospital_id),
      array['organization_admin']::text[]
    )
    or public.has_hospital_role(hospital_id, array['hospital_admin']::text[])
  );

create policy "Users can read their own platform grants"
  on public.platform_role_grants for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_super_admin());

create policy "Admins can read tenant-scoped access audit events"
  on public.tenant_audit_logs for select
  to authenticated
  using (
    public.is_platform_super_admin()
    or (
      organization_id is not null
      and public.has_organization_role(organization_id, array['organization_admin']::text[])
    )
    or (
      hospital_id is not null
      and public.has_hospital_role(hospital_id, array['hospital_admin']::text[])
    )
  );

create or replace function public.capture_tenant_access_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_row jsonb;
  resource_id_value uuid;
  organization_id_value uuid;
  hospital_id_value uuid;
  subject_user_id_value uuid;
  role_value text;
begin
  changed_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  resource_id_value := (changed_row ->> 'id')::uuid;
  subject_user_id_value := nullif(changed_row ->> 'user_id', '')::uuid;
  role_value := changed_row ->> 'role';

  if tg_table_name = 'organizations' then
    organization_id_value := resource_id_value;
  elsif tg_table_name = 'hospitals' then
    organization_id_value := (changed_row ->> 'organization_id')::uuid;
    hospital_id_value := resource_id_value;
  elsif tg_table_name = 'departments' then
    hospital_id_value := (changed_row ->> 'hospital_id')::uuid;
    select h.organization_id into organization_id_value
      from public.hospitals h where h.id = hospital_id_value;
  elsif tg_table_name = 'organization_memberships' then
    organization_id_value := (changed_row ->> 'organization_id')::uuid;
  elsif tg_table_name = 'hospital_memberships' then
    hospital_id_value := (changed_row ->> 'hospital_id')::uuid;
    select h.organization_id into organization_id_value
      from public.hospitals h where h.id = hospital_id_value;
  elsif tg_table_name = 'hospital_role_grants' then
    select hm.hospital_id, hm.user_id into hospital_id_value, subject_user_id_value
      from public.hospital_memberships hm
     where hm.id = (changed_row ->> 'membership_id')::uuid;
    select h.organization_id into organization_id_value
      from public.hospitals h where h.id = hospital_id_value;
  elsif tg_table_name = 'platform_role_grants' then
    subject_user_id_value := (changed_row ->> 'user_id')::uuid;
  end if;

  insert into public.tenant_audit_logs (
    actor_user_id,
    action,
    resource_type,
    resource_id,
    organization_id,
    hospital_id,
    subject_user_id,
    role
  )
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    resource_id_value,
    organization_id_value,
    hospital_id_value,
    subject_user_id_value,
    role_value
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.capture_tenant_access_audit() from public, anon, authenticated;

create trigger audit_organizations_access
  after insert or update or delete on public.organizations
  for each row execute function public.capture_tenant_access_audit();
create trigger audit_hospitals_access
  after insert or update or delete on public.hospitals
  for each row execute function public.capture_tenant_access_audit();
create trigger audit_departments_access
  after insert or update or delete on public.departments
  for each row execute function public.capture_tenant_access_audit();
create trigger audit_organization_memberships_access
  after insert or update or delete on public.organization_memberships
  for each row execute function public.capture_tenant_access_audit();
create trigger audit_hospital_memberships_access
  after insert or update or delete on public.hospital_memberships
  for each row execute function public.capture_tenant_access_audit();
create trigger audit_hospital_role_grants_access
  after insert or update or delete on public.hospital_role_grants
  for each row execute function public.capture_tenant_access_audit();
create trigger audit_platform_role_grants_access
  after insert or update or delete on public.platform_role_grants
  for each row execute function public.capture_tenant_access_audit();
