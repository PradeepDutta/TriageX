create table if not exists public.doctor_applications (
  user_id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(btrim(phone)) between 7 and 24),
  qualification text not null check (char_length(btrim(qualification)) between 2 and 120),
  registration_number text not null check (char_length(btrim(registration_number)) between 3 and 80),
  specialization text not null check (char_length(btrim(specialization)) between 2 and 100),
  affiliation text not null check (char_length(btrim(affiliation)) between 2 and 200),
  requested_hospital_id uuid not null references public.hospitals (id) on delete restrict,
  requested_department_id uuid not null,
  credential_document_path text not null unique,
  assigned_department_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  decision_note text,
  reviewer_user_id uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (requested_hospital_id, requested_department_id)
    references public.departments (hospital_id, id) on delete restrict,
  foreign key (requested_hospital_id, assigned_department_id)
    references public.departments (hospital_id, id) on delete restrict,
  check (
    (status = 'pending' and reviewer_user_id is null and reviewed_at is null)
    or (status <> 'pending' and reviewer_user_id is not null and reviewed_at is not null)
  ),
  check (
    (status = 'approved' and assigned_department_id is not null)
    or (status <> 'approved' and assigned_department_id is null)
  ),
  check (decision_note is null or char_length(decision_note) <= 1000)
);

create unique index if not exists doctor_applications_registration_number_unique
  on public.doctor_applications (lower(btrim(registration_number)));
create index if not exists doctor_applications_hospital_status_submitted_idx
  on public.doctor_applications (requested_hospital_id, status, submitted_at desc);

create table if not exists public.doctor_application_audit_logs (
  id bigint generated always as identity primary key,
  application_user_id uuid not null references auth.users (id) on delete restrict,
  actor_user_id uuid references auth.users (id) on delete set null,
  hospital_id uuid references public.hospitals (id) on delete restrict,
  action text not null check (action in ('account_created', 'submitted', 'approved', 'rejected', 'suspended')),
  reason text,
  occurred_at timestamptz not null default now()
);

create index if not exists doctor_application_audit_logs_hospital_time_idx
  on public.doctor_application_audit_logs (hospital_id, occurred_at desc);
create index if not exists doctor_application_audit_logs_application_time_idx
  on public.doctor_application_audit_logs (application_user_id, occurred_at desc);

alter table public.doctor_applications enable row level security;
alter table public.doctor_application_audit_logs enable row level security;
revoke all on public.doctor_applications, public.doctor_application_audit_logs
  from public, anon, authenticated;
grant select on public.doctor_applications, public.doctor_application_audit_logs to authenticated;

create or replace function public.can_review_doctor_application(target_hospital_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_hospital_id is not null
    and (
      public.is_platform_super_admin()
      or public.has_hospital_role(target_hospital_id, array['hospital_admin']::text[])
      or exists (
        select 1
          from public.hospitals h
         where h.id = target_hospital_id
           and public.has_organization_role(
             h.organization_id,
             array['organization_admin']::text[]
           )
      )
    );
$$;

create or replace function public.can_review_any_doctor_applications()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_super_admin()
      or exists (
        select 1
          from public.hospital_memberships hm
          join public.hospitals h on h.id = hm.hospital_id
         where public.can_review_doctor_application(h.id)
      )
      or exists (
        select 1
          from public.organization_memberships om
         where public.has_organization_role(
           om.organization_id,
           array['organization_admin']::text[]
         )
      );
$$;

create or replace function public.list_active_doctor_facilities()
returns table (
  hospital_id uuid,
  hospital_name text,
  organization_name text,
  department_id uuid,
  department_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.name, o.name, d.id, d.name
    from public.hospitals h
    join public.organizations o on o.id = h.organization_id
    join public.departments d on d.hospital_id = h.id
   where h.status = 'active'
     and o.status = 'active'
     and d.status = 'active'
   order by o.name, h.name, d.name;
$$;

create or replace function public.submit_doctor_application(
  application_full_name text,
  application_phone text,
  application_qualification text,
  application_registration_number text,
  application_specialization text,
  application_affiliation text,
  application_hospital_id uuid,
  application_department_id uuid,
  application_document_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if actor_id is null or actor_email = '' then
    raise exception using errcode = '28000', message = 'A verified account is required.';
  end if;
  if char_length(btrim(application_full_name)) not between 2 and 100
     or char_length(btrim(application_phone)) not between 7 and 24
     or btrim(application_phone) !~ '^[+]?[0-9[:space:]().-]{7,24}$'
     or char_length(regexp_replace(btrim(application_phone), '[^0-9]', '', 'g')) not between 7 and 15
     or char_length(btrim(application_qualification)) not between 2 and 120
     or char_length(btrim(application_registration_number)) not between 3 and 80
     or char_length(btrim(application_specialization)) not between 2 and 100
     or char_length(btrim(application_affiliation)) not between 2 and 200
     or application_document_path not like actor_id::text || '/%'
     or char_length(application_document_path) > 160 then
    raise exception using errcode = '22023', message = 'Application details are invalid.';
  end if;
  if not exists (
    select 1
      from public.hospitals h
      join public.organizations o on o.id = h.organization_id
      join public.departments d on d.hospital_id = h.id
     where h.id = application_hospital_id
       and d.id = application_department_id
       and h.status = 'active'
       and o.status = 'active'
       and d.status = 'active'
  ) then
    raise exception using errcode = '22023', message = 'The selected facility is not accepting applications.';
  end if;
  if exists (
    select 1
      from public.hospital_memberships hm
      join public.hospital_role_grants hrg on hrg.membership_id = hm.id
     where hm.user_id = actor_id
       and hm.status = 'active'
       and hrg.role = 'doctor'
       and hrg.revoked_at is null
  ) then
    raise exception using errcode = '23505', message = 'Doctor access has already been assigned to this account.';
  end if;
  if not exists (
    select 1
      from storage.objects so
     where so.bucket_id = 'doctor-credentials'
       and so.name = application_document_path
  ) then
    raise exception using errcode = '22023', message = 'A credential document is required.';
  end if;

  insert into public.doctor_applications (
    user_id,
    full_name,
    email,
    phone,
    qualification,
    registration_number,
    specialization,
    affiliation,
    requested_hospital_id,
    requested_department_id,
    credential_document_path
  ) values (
    actor_id,
    btrim(application_full_name),
    actor_email,
    btrim(application_phone),
    btrim(application_qualification),
    btrim(application_registration_number),
    btrim(application_specialization),
    btrim(application_affiliation),
    application_hospital_id,
    application_department_id,
    application_document_path
  );

  return jsonb_build_object('success', true, 'status', 'pending');
end;
$$;

create or replace function public.review_doctor_application(
  application_user_id uuid,
  decision text,
  decision_reason text default null,
  target_department_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  application_row public.doctor_applications%rowtype;
  membership_id uuid;
  membership_status text;
  normalized_reason text := nullif(btrim(coalesce(decision_reason, '')), '');
begin
  if actor_id is null then
    raise exception using errcode = '28000', message = 'A verified reviewer is required.';
  end if;
  if decision is null or decision not in ('approve', 'reject', 'suspend') then
    raise exception using errcode = '22023', message = 'The requested decision is invalid.';
  end if;

  select * into application_row
    from public.doctor_applications
   where user_id = application_user_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Application not found.';
  end if;
  if not public.can_review_doctor_application(application_row.requested_hospital_id) then
    raise exception using errcode = '42501', message = 'Reviewer is not authorized for this hospital.';
  end if;
  if actor_id = application_user_id then
    raise exception using errcode = '42501', message = 'Applicants cannot review their own application.';
  end if;

  if decision = 'approve' then
    if application_row.status <> 'pending' or target_department_id is null then
      raise exception using errcode = '22023', message = 'Only pending applications can be approved.';
    end if;
    if not exists (
      select 1
        from public.departments d
       where d.id = target_department_id
         and d.hospital_id = application_row.requested_hospital_id
         and d.status = 'active'
    ) then
      raise exception using errcode = '22023', message = 'The assigned department is invalid.';
    end if;

    select hm.id, hm.status into membership_id, membership_status
      from public.hospital_memberships hm
     where hm.user_id = application_row.user_id
       and hm.hospital_id = application_row.requested_hospital_id
     for update;
    if membership_id is null then
      insert into public.hospital_memberships (
        hospital_id, user_id, status, granted_by
      ) values (
        application_row.requested_hospital_id, application_row.user_id, 'active', actor_id
      )
      returning id into membership_id;
    elsif membership_status <> 'active' then
      raise exception using errcode = '23514', message = 'The existing hospital membership is not active.';
    end if;

    insert into public.hospital_role_grants (
      membership_id, hospital_id, department_id, role, granted_by
    ) values (
      membership_id,
      application_row.requested_hospital_id,
      target_department_id,
      'doctor',
      actor_id
    );

    update public.doctor_applications
       set status = 'approved',
           assigned_department_id = target_department_id,
           decision_note = normalized_reason,
           reviewer_user_id = actor_id,
           reviewed_at = now(),
           updated_at = now()
     where user_id = application_row.user_id;
  elsif decision = 'reject' then
    if application_row.status <> 'pending'
       or normalized_reason is null
       or char_length(normalized_reason) not between 3 and 1000 then
      raise exception using errcode = '22023', message = 'A rejection reason is required for a pending application.';
    end if;
    update public.hospital_role_grants hrg
       set revoked_at = now()
      from public.hospital_memberships hm
     where hm.id = hrg.membership_id
       and hm.user_id = application_row.user_id
       and hm.hospital_id = application_row.requested_hospital_id
       and hrg.role = 'doctor'
       and hrg.revoked_at is null;
    update public.doctor_applications
       set status = 'rejected',
           decision_note = normalized_reason,
           reviewer_user_id = actor_id,
           reviewed_at = now(),
           updated_at = now()
     where user_id = application_row.user_id;
  else
    if application_row.status <> 'approved'
       or normalized_reason is null
       or char_length(normalized_reason) not between 3 and 1000 then
      raise exception using errcode = '22023', message = 'A reason is required to suspend an approved doctor.';
    end if;
    update public.hospital_role_grants hrg
       set revoked_at = now()
      from public.hospital_memberships hm
     where hm.id = hrg.membership_id
       and hm.user_id = application_row.user_id
       and hm.hospital_id = application_row.requested_hospital_id
       and hrg.role = 'doctor'
       and hrg.revoked_at is null;
    update public.doctor_applications
       set status = 'suspended',
           assigned_department_id = null,
           decision_note = normalized_reason,
           reviewer_user_id = actor_id,
           reviewed_at = now(),
           updated_at = now()
     where user_id = application_row.user_id;
  end if;

  return jsonb_build_object('success', true, 'status',
    case when decision = 'approve' then 'approved'
         when decision = 'reject' then 'rejected'
         else 'suspended' end);
end;
$$;

create or replace function public.audit_doctor_application_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
begin
  if tg_op = 'INSERT' then
    audit_action := 'submitted';
  elsif new.status is distinct from old.status then
    audit_action := new.status;
  else
    return new;
  end if;

  insert into public.doctor_application_audit_logs (
    application_user_id, actor_user_id, hospital_id, action, reason
  ) values (
    new.user_id, (select auth.uid()), new.requested_hospital_id,
    audit_action, new.decision_note
  );
  return new;
end;
$$;

create or replace function public.audit_doctor_auth_account_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'registration_intent' = 'doctor' then
    insert into public.doctor_application_audit_logs (
      application_user_id, actor_user_id, hospital_id, action
    ) values (
      new.id, null, null, 'account_created'
    );
  end if;
  return new;
end;
$$;

create or replace function public.prevent_doctor_application_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Doctor application audit events are immutable.';
end;
$$;

create trigger doctor_application_audit_change
  after insert or update on public.doctor_applications
  for each row execute function public.audit_doctor_application_change();
drop trigger if exists on_auth_doctor_account_created_audit on auth.users;
create trigger on_auth_doctor_account_created_audit
  after insert on auth.users
  for each row execute function public.audit_doctor_auth_account_creation();
create trigger doctor_application_audit_immutable
  before update or delete on public.doctor_application_audit_logs
  for each row execute function public.prevent_doctor_application_audit_mutation();

revoke all on function public.can_review_doctor_application(uuid) from public, anon;
revoke all on function public.can_review_any_doctor_applications() from public, anon;
revoke all on function public.list_active_doctor_facilities() from public, anon;
revoke all on function public.submit_doctor_application(text, text, text, text, text, text, uuid, uuid, text)
  from public, anon;
revoke all on function public.review_doctor_application(uuid, text, text, uuid) from public, anon;
revoke all on function public.audit_doctor_application_change() from public, anon, authenticated;
revoke all on function public.audit_doctor_auth_account_creation() from public, anon, authenticated;
revoke all on function public.prevent_doctor_application_audit_mutation() from public, anon, authenticated;
grant execute on function public.can_review_doctor_application(uuid) to authenticated;
grant execute on function public.can_review_any_doctor_applications() to authenticated;
grant execute on function public.list_active_doctor_facilities() to anon, authenticated;
grant execute on function public.submit_doctor_application(text, text, text, text, text, text, uuid, uuid, text)
  to authenticated;
grant execute on function public.review_doctor_application(uuid, text, text, uuid) to authenticated;

create policy "Applicants and explicit tenant administrators can read applications"
  on public.doctor_applications for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_review_doctor_application(requested_hospital_id)
  );

create policy "Explicit tenant administrators can read application audit events"
  on public.doctor_application_audit_logs for select
  to authenticated
  using (
    application_user_id = (select auth.uid())
    or public.can_review_doctor_application(hospital_id)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-credentials',
  'doctor-credentials',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];

create or replace function public.can_access_doctor_credential(
  target_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.doctor_applications da
     where da.credential_document_path = target_object_name
       and (
         da.user_id = (select auth.uid())
         or public.can_review_doctor_application(da.requested_hospital_id)
       )
  );
$$;

revoke all on function public.can_access_doctor_credential(text) from public, anon;
grant execute on function public.can_access_doctor_credential(text) to authenticated;

drop policy if exists "Doctors upload their own credential documents" on storage.objects;
create policy "Doctors upload their own credential documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'doctor-credentials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Applicants and reviewers read authorized credential documents" on storage.objects;
create policy "Applicants and reviewers read authorized credential documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'doctor-credentials'
    and public.can_access_doctor_credential(name)
  );

drop policy if exists "Applicants delete their unsubmitted credential documents" on storage.objects;
create policy "Applicants delete their unsubmitted credential documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'doctor-credentials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (
      select 1
        from public.doctor_applications da
       where da.credential_document_path = name
    )
  );
