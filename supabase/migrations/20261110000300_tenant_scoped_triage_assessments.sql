create table if not exists public.triage_assessments (
  id text primary key default (
    'TRG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  owner_user_id uuid references auth.users (id) on delete restrict,
  hospital_id uuid references public.hospitals (id) on delete restrict,
  department_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  record_data jsonb not null check (jsonb_typeof(record_data) = 'object'),
  triage_level text not null check (triage_level in ('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE')),
  priority_score integer not null check (priority_score between 0 and 100),
  status text not null default 'PENDING_DOCTOR_APPROVAL'
    check (status in ('PENDING_DOCTOR_APPROVAL', 'DOCTOR_REVIEWED')),
  is_simulated boolean not null default false,
  doctor_notes text not null default '',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  was_overridden boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (hospital_id, department_id)
    references public.departments (hospital_id, id) on delete restrict,
  check (
    (owner_user_id is not null and hospital_id is null and department_id is null)
    or (owner_user_id is null and hospital_id is not null and department_id is not null)
  ),
  check (
    (status = 'PENDING_DOCTOR_APPROVAL' and reviewed_by is null and reviewed_at is null)
    or (status = 'DOCTOR_REVIEWED' and reviewed_at is not null)
  )
);

create index if not exists triage_assessments_owner_created_idx
  on public.triage_assessments (owner_user_id, created_at desc)
  where owner_user_id is not null;
create index if not exists triage_assessments_hospital_created_idx
  on public.triage_assessments (hospital_id, created_at desc)
  where hospital_id is not null;
create index if not exists triage_assessments_department_created_idx
  on public.triage_assessments (hospital_id, department_id, created_at desc)
  where department_id is not null;
create index if not exists triage_assessments_status_priority_idx
  on public.triage_assessments (hospital_id, status, priority_score desc, created_at)
  where hospital_id is not null;

alter table public.triage_assessments enable row level security;
revoke all on public.triage_assessments from public, anon, authenticated;
grant select on public.triage_assessments to authenticated;
grant insert (
  owner_user_id,
  hospital_id,
  department_id,
  created_by,
  record_data,
  triage_level,
  priority_score,
  status,
  is_simulated,
  doctor_notes,
  reviewed_by,
  reviewed_at,
  was_overridden
) on public.triage_assessments to authenticated;
grant update (
  record_data,
  triage_level,
  priority_score,
  status,
  doctor_notes,
  was_overridden
) on public.triage_assessments to authenticated;

create or replace function public.set_triage_assessment_review_actor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'DOCTOR_REVIEWED' and (
    old.status is distinct from new.status
    or old.record_data is distinct from new.record_data
    or old.triage_level is distinct from new.triage_level
    or old.priority_score is distinct from new.priority_score
    or old.doctor_notes is distinct from new.doctor_notes
    or old.was_overridden is distinct from new.was_overridden
  ) then
    new.reviewed_by := (select auth.uid());
    if new.reviewed_by is null then
      raise exception 'An authenticated reviewer is required.';
    end if;
    new.reviewed_at := now();
  elsif new.status = 'PENDING_DOCTOR_APPROVAL' and (
    old.record_data is distinct from new.record_data
    or old.triage_level is distinct from new.triage_level
    or old.priority_score is distinct from new.priority_score
    or old.doctor_notes is distinct from new.doctor_notes
    or old.was_overridden is distinct from new.was_overridden
  ) then
    raise exception 'Clinical assessment changes must be recorded as a review.';
  end if;

  return new;
end;
$$;

revoke all on function public.set_triage_assessment_review_actor() from public, anon, authenticated;

create trigger set_triage_assessment_review_actor
  before update on public.triage_assessments
  for each row execute function public.set_triage_assessment_review_actor();

create or replace function public.can_access_triage_assessment(
  target_hospital_id uuid,
  target_department_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_hospital_id is not null
      and target_department_id is not null
      and (
        public.is_platform_super_admin()
        or (
          public.can_access_hospital(target_hospital_id)
          and (
            exists (
              select 1
                from public.hospitals h
               where h.id = target_hospital_id
                 and public.has_organization_role(
                   h.organization_id,
                   array['organization_admin']::text[]
                 )
            )
            or exists (
              select 1
                from public.departments d
               where d.id = target_department_id
                 and d.hospital_id = target_hospital_id
                 and d.status = 'active'
                 and public.has_hospital_role(
                   target_hospital_id,
                   array['hospital_admin', 'department_manager', 'doctor', 'nurse', 'triage_staff']::text[],
                   target_department_id
                 )
            )
          )
        )
      );
$$;

create or replace function public.can_create_triage_assessment(
  target_hospital_id uuid,
  target_department_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_hospital_id is not null
     and target_department_id is not null
     and public.can_access_hospital(target_hospital_id)
     and exists (
       select 1
         from public.departments d
        where d.id = target_department_id
          and d.hospital_id = target_hospital_id
          and d.status = 'active'
          and public.has_hospital_role(
            target_hospital_id,
            array['hospital_admin', 'department_manager', 'doctor', 'nurse', 'triage_staff']::text[],
            target_department_id
          )
     );
$$;

create or replace function public.can_review_triage_assessment(
  target_hospital_id uuid,
  target_department_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_create_triage_assessment(
    target_hospital_id,
    target_department_id
  );
$$;

revoke all on function public.can_access_triage_assessment(uuid, uuid) from public, anon;
revoke all on function public.can_create_triage_assessment(uuid, uuid) from public, anon;
revoke all on function public.can_review_triage_assessment(uuid, uuid) from public, anon;
grant execute on function public.can_access_triage_assessment(uuid, uuid) to authenticated;
grant execute on function public.can_create_triage_assessment(uuid, uuid) to authenticated;
grant execute on function public.can_review_triage_assessment(uuid, uuid) to authenticated;

create policy "Patients read their private assessments and staff read authorized cases"
  on public.triage_assessments for select
  to authenticated
  using (
    (owner_user_id = (select auth.uid()) and hospital_id is null)
    or public.can_access_triage_assessment(hospital_id, department_id)
  );

create policy "Patients create private assessments and staff create authorized cases"
  on public.triage_assessments for insert
  to authenticated
  with check (
    (
      owner_user_id = (select auth.uid())
      and hospital_id is null
      and department_id is null
      and created_by = (select auth.uid())
      and status = 'PENDING_DOCTOR_APPROVAL'
      and doctor_notes = ''
      and reviewed_by is null
      and reviewed_at is null
      and not was_overridden
      and exists (
        select 1
          from public.profiles p
         where p.id = (select auth.uid())
           and p.role = 'patient'
      )
    )
    or (
      owner_user_id is null
      and hospital_id is not null
      and created_by = (select auth.uid())
      and status = 'PENDING_DOCTOR_APPROVAL'
      and doctor_notes = ''
      and reviewed_by is null
      and reviewed_at is null
      and not was_overridden
      and public.can_create_triage_assessment(hospital_id, department_id)
    )
  );

create policy "Authorized tenant staff update clinical assessments"
  on public.triage_assessments for update
  to authenticated
  using (
    hospital_id is not null
    and public.can_review_triage_assessment(hospital_id, department_id)
  )
  with check (
    hospital_id is not null
    and public.can_review_triage_assessment(hospital_id, department_id)
  );
