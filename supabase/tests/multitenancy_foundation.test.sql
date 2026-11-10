begin;

create extension if not exists pgtap with schema extensions;

set local search_path = public, extensions;

select plan(69);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  ('92000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'tenant-doctor-a@example.invalid', '', now(), '{}'::jsonb, '{}'),
  ('92000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'tenant-hospital-admin-a@example.invalid', '', now(), '{}'::jsonb, '{}'),
  ('92000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'tenant-org-admin-a@example.invalid', '', now(), '{}'::jsonb, '{}'),
  ('92000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'tenant-platform-admin@example.invalid', '', now(), '{}'::jsonb, '{}'),
  ('92000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'tenant-patient@example.invalid', '', now(), '{}'::jsonb, '{}'),
  ('92000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'tenant-legacy-admin@example.invalid', '', now(), '{}'::jsonb, '{}'),
  ('92000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'tenant-patient-other@example.invalid', '', now(), '{}'::jsonb, '{}');

update public.profiles
   set role = 'admin'
 where id = '92000000-0000-4000-8000-000000000006';

insert into public.organizations (id, name, slug, status)
values
  ('92000000-0000-4000-8000-000000000101', 'Tenant Test Organization A', 'tenant-test-organization-a', 'active'),
  ('92000000-0000-4000-8000-000000000102', 'Tenant Test Organization B', 'tenant-test-organization-b', 'active');

insert into public.hospitals (id, organization_id, name, slug, status)
values
  ('92000000-0000-4000-8000-000000000201', '92000000-0000-4000-8000-000000000101', 'Tenant Test Hospital A', 'tenant-test-hospital-a', 'active'),
  ('92000000-0000-4000-8000-000000000202', '92000000-0000-4000-8000-000000000102', 'Tenant Test Hospital B', 'tenant-test-hospital-b', 'active');

insert into public.departments (id, hospital_id, name, code, status)
values
  ('92000000-0000-4000-8000-000000000301', '92000000-0000-4000-8000-000000000201', 'Test Department A', 'TEST-A', 'active'),
  ('92000000-0000-4000-8000-000000000303', '92000000-0000-4000-8000-000000000201', 'Test Department A2', 'TEST-A2', 'active'),
  ('92000000-0000-4000-8000-000000000302', '92000000-0000-4000-8000-000000000202', 'Test Department B', 'TEST-B', 'active');

insert into public.organization_memberships (id, organization_id, user_id, role, status)
values (
  '92000000-0000-4000-8000-000000000401',
  '92000000-0000-4000-8000-000000000101',
  '92000000-0000-4000-8000-000000000003',
  'organization_admin',
  'active'
);

insert into public.hospital_memberships (id, hospital_id, user_id, status)
values
  ('92000000-0000-4000-8000-000000000501', '92000000-0000-4000-8000-000000000201', '92000000-0000-4000-8000-000000000001', 'active'),
  ('92000000-0000-4000-8000-000000000502', '92000000-0000-4000-8000-000000000201', '92000000-0000-4000-8000-000000000002', 'active');

insert into public.hospital_role_grants (membership_id, hospital_id, department_id, role, granted_by)
values
  ('92000000-0000-4000-8000-000000000501', '92000000-0000-4000-8000-000000000201', '92000000-0000-4000-8000-000000000301', 'doctor', '92000000-0000-4000-8000-000000000003'),
  ('92000000-0000-4000-8000-000000000502', '92000000-0000-4000-8000-000000000201', null, 'hospital_admin', '92000000-0000-4000-8000-000000000003');

insert into public.platform_role_grants (user_id, role, granted_by)
values (
  '92000000-0000-4000-8000-000000000004',
  'platform_super_admin',
  '92000000-0000-4000-8000-000000000003'
);

insert into public.triage_assessments (
  id, owner_user_id, hospital_id, department_id, created_by, record_data,
  triage_level, priority_score, is_simulated
)
values
  (
    'TRG-TEST0001',
    '92000000-0000-4000-8000-000000000005',
    null,
    null,
    '92000000-0000-4000-8000-000000000005',
    '{"patientName":"Patient One"}'::jsonb,
    'GREEN',
    20,
    true
  ),
  (
    'TRG-TEST0002',
    '92000000-0000-4000-8000-000000000007',
    null,
    null,
    '92000000-0000-4000-8000-000000000007',
    '{"patientName":"Patient Two"}'::jsonb,
    'GREEN',
    20,
    true
  ),
  (
    'TRG-TEST0003',
    null,
    '92000000-0000-4000-8000-000000000201',
    '92000000-0000-4000-8000-000000000301',
    '92000000-0000-4000-8000-000000000001',
    '{"patientName":"Department A case"}'::jsonb,
    'YELLOW',
    60,
    true
  ),
  (
    'TRG-TEST0004',
    null,
    '92000000-0000-4000-8000-000000000201',
    '92000000-0000-4000-8000-000000000303',
    '92000000-0000-4000-8000-000000000002',
    '{"patientName":"Department A2 case"}'::jsonb,
    'GREEN',
    20,
    true
  ),
  (
    'TRG-TEST0005',
    null,
    '92000000-0000-4000-8000-000000000202',
    '92000000-0000-4000-8000-000000000302',
    '92000000-0000-4000-8000-000000000002',
    '{"patientName":"Hospital B case"}'::jsonb,
    'BLUE',
    10,
    true
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000005', true);
select is((select count(*) from public.hospitals), 0::bigint, 'patient cannot read hospital records');
select ok(not public.is_platform_super_admin(), 'patient has no implicit platform access');
select is((select count(*) from public.triage_assessments), 1::bigint, 'patient can read only their private assessment');
select is((select count(*) from public.triage_assessments where owner_user_id = '92000000-0000-4000-8000-000000000005'), 1::bigint, 'patient can read their own assessment');
select is((select count(*) from public.triage_assessments where owner_user_id = '92000000-0000-4000-8000-000000000007'), 0::bigint, 'patient cannot read another patient assessment');
select is((select count(*) from public.triage_assessments where hospital_id is not null), 0::bigint, 'patient cannot read hospital cases');
select throws_ok(
  $$insert into public.triage_assessments (
      id, owner_user_id, hospital_id, department_id, created_by, record_data, triage_level, priority_score
    ) values (
      'TRG-TEST0010',
      null,
      '92000000-0000-4000-8000-000000000201',
      '92000000-0000-4000-8000-000000000301',
      '92000000-0000-4000-8000-000000000005',
      '{"patientName":"Unauthorized case"}'::jsonb,
      'GREEN',
      20
    )$$,
  '42501',
  null,
  'patient cannot create a hospital case without an explicit staff grant'
);
select throws_ok(
  $$insert into public.triage_assessments (
      id, owner_user_id, created_by, record_data, triage_level, priority_score
    ) values (
      'TRG-TEST0011',
      '92000000-0000-4000-8000-000000000007',
      '92000000-0000-4000-8000-000000000005',
      '{"patientName":"Other patient"}'::jsonb,
      'GREEN',
      20
    )$$,
  '42501',
  null,
  'patient cannot create a private assessment for another account'
);

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000001', true);
select ok(public.has_hospital_role(
  '92000000-0000-4000-8000-000000000201',
  array['doctor']::text[],
  '92000000-0000-4000-8000-000000000301'
), 'doctor can access the assigned hospital department');
select ok(not public.has_hospital_role(
  '92000000-0000-4000-8000-000000000202',
  array['doctor']::text[],
  '92000000-0000-4000-8000-000000000302'
), 'doctor cannot access another hospital');
select is((select count(*) from public.hospitals), 1::bigint, 'doctor sees only the assigned hospital');
select is((select count(*) from public.departments), 1::bigint, 'doctor sees only the assigned department');
select is((select count(*) from public.triage_assessments where hospital_id = '92000000-0000-4000-8000-000000000201'), 1::bigint, 'doctor sees only the assigned department case');
select is((select count(*) from public.triage_assessments where department_id = '92000000-0000-4000-8000-000000000303'), 0::bigint, 'doctor cannot read another department case');
select is((select count(*) from public.triage_assessments where hospital_id = '92000000-0000-4000-8000-000000000202'), 0::bigint, 'doctor cannot read another hospital case');
select is((select count(*) from public.triage_assessments where owner_user_id is not null), 0::bigint, 'doctor cannot read private patient assessments');
select lives_ok(
  $$insert into public.triage_assessments (
      id, owner_user_id, hospital_id, department_id, created_by, record_data, triage_level, priority_score, is_simulated
    ) values (
      'TRG-TEST0012',
      null,
      '92000000-0000-4000-8000-000000000201',
      '92000000-0000-4000-8000-000000000301',
      '92000000-0000-4000-8000-000000000001',
      '{"patientName":"Doctor-created department case"}'::jsonb,
      'GREEN',
      20,
      true
    )$$,
  'doctor can create a case in an explicitly assigned department'
);
select lives_ok(
  $$update public.triage_assessments
       set record_data = record_data || '{"status":"DOCTOR_REVIEWED"}'::jsonb,
           triage_level = 'YELLOW',
           priority_score = 65,
           status = 'DOCTOR_REVIEWED',
           doctor_notes = 'Synthetic test review',
           was_overridden = true
     where id = 'TRG-TEST0003'$$,
  'authorized doctor can review an assessment in the assigned department'
);
select is(
  (select reviewed_by from public.triage_assessments where id = 'TRG-TEST0003'),
  auth.uid(),
  'database review actor is taken from the authenticated user'
);
select throws_ok(
  $$update public.triage_assessments
       set reviewed_by = '92000000-0000-4000-8000-000000000002'
     where id = 'TRG-TEST0003'$$,
  '42501',
  null,
  'authenticated staff cannot directly spoof the review actor'
);

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000002', true);
select ok(public.has_hospital_role(
  '92000000-0000-4000-8000-000000000201',
  array['hospital_admin']::text[]
), 'hospital admin has its explicitly granted hospital role');
select ok(not public.has_hospital_role(
  '92000000-0000-4000-8000-000000000202',
  array['hospital_admin']::text[]
), 'hospital admin cannot access a different hospital');
select is((select count(*) from public.hospitals), 1::bigint, 'hospital admin sees only its hospital');
select is((select count(*) from public.triage_assessments where hospital_id = '92000000-0000-4000-8000-000000000201'), 3::bigint, 'hospital admin sees its hospital assessments');
select is((select count(*) from public.triage_assessments where hospital_id = '92000000-0000-4000-8000-000000000202'), 0::bigint, 'hospital admin cannot read another hospital assessments');

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000003', true);
select ok(public.has_organization_role(
  '92000000-0000-4000-8000-000000000101',
  array['organization_admin']::text[]
), 'organization admin has the explicit organization grant');
select is((select count(*) from public.hospitals), 1::bigint, 'organization admin sees only hospitals in its organization');
select is((select count(*) from public.triage_assessments where owner_user_id is not null), 0::bigint, 'organization admin does not see private patient assessments');
select is((select count(*) from public.triage_assessments where hospital_id = '92000000-0000-4000-8000-000000000202'), 0::bigint, 'organization admin cannot read another organization assessments');
select is((select count(*) from public.triage_assessments where hospital_id = '92000000-0000-4000-8000-000000000201'), 3::bigint, 'organization admin sees scoped assessments in its organization');

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000006', true);
select ok(not public.is_platform_super_admin(), 'legacy admin has no implicit platform privilege');
select ok(not public.has_hospital_role(
  '92000000-0000-4000-8000-000000000201',
  array['hospital_admin', 'doctor']::text[]
), 'legacy admin has no implicit hospital privilege');
select is((select count(*) from public.hospitals), 0::bigint, 'legacy admin sees no tenant hospitals');
select is(
  (select role from public.profiles where id = auth.uid()),
  'admin',
  'legacy admin role remains unchanged'
);
select is((select count(*) from public.triage_assessments where hospital_id is not null), 0::bigint, 'legacy admin sees no tenant assessments');
select is((select count(*) from public.triage_assessments where owner_user_id is not null), 0::bigint, 'legacy admin sees no private patient assessments');

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000004', true);
select ok(public.is_platform_super_admin(), 'platform access requires and recognizes an explicit grant');
select is((select count(*) from public.hospitals), 2::bigint, 'explicit platform grant can read both hospitals');
select is((select count(*) from public.triage_assessments where hospital_id is not null), 4::bigint, 'explicit platform grant can read tenant assessments');
select is((select count(*) from public.triage_assessments where owner_user_id is not null), 0::bigint, 'platform access does not expose private patient assessments');

reset role;
update public.hospital_role_grants
   set revoked_at = now()
 where membership_id = '92000000-0000-4000-8000-000000000501';
set local role authenticated;
select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000001', true);
select ok(not public.has_hospital_role(
  '92000000-0000-4000-8000-000000000201',
  array['doctor']::text[],
  '92000000-0000-4000-8000-000000000301'
), 'revoked department grant stops authorizing immediately');
select is((select count(*) from public.hospitals), 0::bigint, 'revoked doctor cannot read hospital metadata');
select is((select count(*) from public.triage_assessments where hospital_id is not null), 0::bigint, 'revoked doctor cannot read tenant assessments');

reset role;
update public.hospital_memberships
   set status = 'revoked'
 where id = '92000000-0000-4000-8000-000000000502';
update public.organizations
   set status = 'suspended'
 where id = '92000000-0000-4000-8000-000000000101';
set local role authenticated;
select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000003', true);
select ok(not public.has_organization_role(
  '92000000-0000-4000-8000-000000000101',
  array['organization_admin']::text[]
), 'suspended organization membership no longer authorizes access');
select is((select count(*) from public.hospitals), 0::bigint, 'organization suspension hides its hospitals');
select is((select count(*) from public.triage_assessments where hospital_id is not null), 0::bigint, 'organization suspension hides its assessments');

reset role;
update public.organizations
   set status = 'active'
 where id = '92000000-0000-4000-8000-000000000101';
update public.hospital_memberships
   set status = 'active'
 where id = '92000000-0000-4000-8000-000000000502';
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data
) values (
  '92000000-0000-4000-8000-000000000008',
  'authenticated',
  'authenticated',
  'doctor-application-audit@example.invalid',
  '',
  now(),
  '{}'::jsonb,
  '{"registration_intent":"doctor"}'::jsonb
);

insert into public.doctor_applications (
  user_id, full_name, email, phone, qualification, registration_number,
  specialization, affiliation, requested_hospital_id, requested_department_id,
  credential_document_path
) values
  (
    '92000000-0000-4000-8000-000000000002',
    'Hospital Administrator Applicant',
    'tenant-hospital-admin-a@example.invalid',
    '+10000000002',
    'Test Medical Degree',
    'REG-TEST-ADMIN',
    'General Medicine',
    'Tenant Test Hospital A',
    '92000000-0000-4000-8000-000000000201',
    '92000000-0000-4000-8000-000000000301',
    '92000000-0000-4000-8000-000000000002/admin.pdf'
  ),
  (
    '92000000-0000-4000-8000-000000000005',
    'Synthetic Doctor Applicant',
    'tenant-patient@example.invalid',
    '+10000000005',
    'Test Medical Degree',
    'REG-TEST-001',
    'General Medicine',
    'Tenant Test Hospital A',
    '92000000-0000-4000-8000-000000000201',
    '92000000-0000-4000-8000-000000000301',
    '92000000-0000-4000-8000-000000000005/credential.pdf'
  );

select is(
  (select count(*) from public.doctor_application_audit_logs
    where application_user_id = '92000000-0000-4000-8000-000000000008'
      and action = 'account_created'),
  1::bigint,
  'doctor-intent Supabase account creation is audited'
);
select throws_ok(
  $$insert into public.doctor_applications (
      user_id, full_name, email, phone, qualification, registration_number,
      specialization, affiliation, requested_hospital_id, requested_department_id,
      credential_document_path
    ) values (
      '92000000-0000-4000-8000-000000000007',
      'Duplicate Registration Applicant',
      'tenant-patient-other@example.invalid',
      '+10000000007',
      'Test Medical Degree',
      'reg-test-001',
      'General Medicine',
      'Tenant Test Hospital A',
      '92000000-0000-4000-8000-000000000201',
      '92000000-0000-4000-8000-000000000301',
      '92000000-0000-4000-8000-000000000007/credential.pdf'
    )$$,
  '23505',
  null,
  'duplicate medical registration numbers are rejected'
);
insert into public.doctor_applications (
  user_id, full_name, email, phone, qualification, registration_number,
  specialization, affiliation, requested_hospital_id, requested_department_id,
  credential_document_path
) values (
  '92000000-0000-4000-8000-000000000007',
  'Synthetic Rejected Applicant',
  'tenant-patient-other@example.invalid',
  '+10000000007',
  'Test Medical Degree',
  'REG-TEST-007',
  'General Medicine',
  'Tenant Test Hospital A',
  '92000000-0000-4000-8000-000000000201',
  '92000000-0000-4000-8000-000000000301',
  '92000000-0000-4000-8000-000000000007/credential.pdf'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000002', true);
select ok(public.can_review_doctor_application('92000000-0000-4000-8000-000000000201'), 'explicit hospital administrator can review applications for its hospital');
select ok(not public.can_review_doctor_application('92000000-0000-4000-8000-000000000202'), 'hospital administrator cannot review another hospital applications');
select ok(public.can_review_any_doctor_applications(), 'explicit hospital administrator is recognized by the review dashboard guard');
select throws_ok(
  $$select public.review_doctor_application(
      '92000000-0000-4000-8000-000000000002',
      'approve',
      null,
      '92000000-0000-4000-8000-000000000301'
    )$$,
  '42501',
  'Applicants cannot review their own application.',
  'applicants cannot approve their own account'
);
select is(
  (public.review_doctor_application(
    '92000000-0000-4000-8000-000000000005',
    'approve',
    null,
    '92000000-0000-4000-8000-000000000301'
  ) ->> 'status'),
  'approved',
  'authorized hospital administrator approves a pending application'
);
select is(
  (public.review_doctor_application(
    '92000000-0000-4000-8000-000000000007',
    'reject',
    'Synthetic test rejection',
    null
  ) ->> 'status'),
  'rejected',
  'authorized hospital administrator rejects a pending application with a reason'
);

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000005', true);
select is((select status from public.doctor_applications where user_id = auth.uid()), 'approved', 'applicant can read the application status');
select is((select count(*) from public.doctor_applications where user_id = '92000000-0000-4000-8000-000000000002'), 0::bigint, 'applicant cannot read another doctor application');
select ok(public.has_hospital_role(
  '92000000-0000-4000-8000-000000000201',
  array['doctor']::text[],
  '92000000-0000-4000-8000-000000000301'
), 'approval creates an explicit doctor role grant for the assigned department');
select ok(not public.has_hospital_role(
  '92000000-0000-4000-8000-000000000202',
  array['doctor']::text[],
  '92000000-0000-4000-8000-000000000302'
), 'approved doctor has no access to a different hospital');
select ok(public.can_access_doctor_credential(
  '92000000-0000-4000-8000-000000000005/credential.pdf'
), 'applicant can access their own credential document');
select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000007', true);
select is((select status from public.doctor_applications where user_id = auth.uid()), 'rejected', 'rejected applicant can see the rejected status');
select ok(not public.has_hospital_role(
  '92000000-0000-4000-8000-000000000201',
  array['doctor']::text[],
  '92000000-0000-4000-8000-000000000301'
), 'rejected applicant receives no doctor role grant');
select is((select count(*) from public.doctor_application_audit_logs
  where application_user_id = auth.uid() and action = 'rejected'),
  1::bigint,
  'rejection is recorded in the immutable application audit log'
);

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000006', true);
select ok(not public.can_review_doctor_application('92000000-0000-4000-8000-000000000201'), 'legacy admin receives no implicit doctor-review access');
select ok(not public.can_access_doctor_credential(
  '92000000-0000-4000-8000-000000000005/credential.pdf'
), 'legacy admin receives no implicit credential-document access');
select ok(not public.can_review_any_doctor_applications(), 'legacy admin cannot enter the doctor review dashboard without an explicit grant');

select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000002', true);
select ok(public.can_access_doctor_credential(
  '92000000-0000-4000-8000-000000000005/credential.pdf'
), 'authorized hospital administrator can review the application credential');
select is(
  (public.review_doctor_application(
    '92000000-0000-4000-8000-000000000005',
    'suspend',
    'Synthetic test suspension',
    null
  ) ->> 'status'),
  'suspended',
  'authorized hospital administrator can suspend a doctor account'
);
select set_config('request.jwt.claim.sub', '92000000-0000-4000-8000-000000000005', true);
select is((select status from public.doctor_applications where user_id = auth.uid()), 'suspended', 'suspended doctor can see the suspended application state');
select ok(not public.has_hospital_role(
  '92000000-0000-4000-8000-000000000201',
  array['doctor']::text[],
  '92000000-0000-4000-8000-000000000301'
), 'suspension revokes the active doctor role grant');

select * from finish();
rollback;
