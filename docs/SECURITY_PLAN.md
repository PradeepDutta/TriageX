# TriageX security plan

**Status:** Phase 1 findings and release gates; not a compliance attestation or security certification.

## Current controls observed

- Supabase Auth session access is server-side through `@supabase/ssr`; Next.js `proxy.js` refreshes cookies.
- Production cookies are marked secure; auth/session cookies are configured `httpOnly`, `sameSite=lax`, and path `/`.
- `getUser()` verifies the Supabase user before current page/API authorization; existing authorization reads a profile role from Postgres.
- Self-registration does not accept a role and the profile trigger defaults to `patient`.
- Profile role has no authenticated update grant in the checked-in migration. Preferences/privacy requests use `auth.uid()` RLS.
- Clinical API routes use authenticated Supabase sessions and explicit hospital/department tenant checks; new RLS policies are authored but not database-tested.
- Publishable key is the only Supabase key configured in the local environment snapshot; no service-role key was present. A publishable key is public by design and is safe only with correctly enforced RLS.

These controls have not been independently audited against the remote database policies or production deployment.

## Phase 2 tenant foundation status

An unapplied migration defines tenant tables, explicit organization/hospital/platform grants, status-aware SQL authorization helpers, read-only authenticated tenant policies, and database-side audit triggers. The server helper layer checks verified Supabase identity and explicit grants without treating legacy `profiles.role` values as tenant privileges. Legacy `admin` is preserved and does not imply `platform_super_admin`.

The tenant foundation and additive assessment migration are local and unapplied. Clinical routes now use the Supabase session client and explicit tenant RPC checks; patient self-assessments are owner-scoped, while staff-created cases require explicit hospital and department assignments. No JWT-backed RLS test has run, and the migration's database behavior is unverified. There is no app-facing tenant creation or role-management workflow. Do not use this work as authorization to process real patient data or launch multi-hospital workflows.

The pgTAP suite in `supabase/tests/multitenancy_foundation.test.sql` contains coverage for patient/legacy-admin isolation, explicit roles, hospital and department boundaries, revocation, suspension, and private assessment ownership. `tests/triage-api-auth.integration.test.mjs` exercises anonymous access against a running app configured with a disposable Supabase project when `TRIAGEX_TEST_API_BASE_URL` is set. Neither database tests nor authenticated live API tests are considered passed until run against an isolated environment. Patient-to-patient isolation has been authored in policies/tests but is not yet demonstrated against PostgreSQL.

The additive doctor onboarding migration adds a private application table, immutable audit log, private credential bucket and owner/reviewer policies. Doctors remain `patient` in the legacy profile table and receive only a department-scoped `doctor` grant after an authorized reviewer approves through a transactional RPC. Review authorization comes from explicit hospital-admin, organization-admin, or platform-super-admin assignments; legacy `admin` is not sufficient. The pgTAP suite now includes doctor approval, self-review denial, duplicate registration number, legacy-admin isolation, document policy helper, and suspension/revocation coverage. This migration and suite have not been executed. Credential authenticity remains a human task; malware scanning, rate limiting, and email notifications are not configured.

## Security gaps to resolve before enterprise or clinical data

### Authorization and tenant boundaries

- Create explicit platform grants and hospital/department memberships; separate platform-level powers from hospital-scoped administration and care roles.
- Preserve existing `admin` assignments until an operator verifies a safe, explicit mapping. Never bulk-map legacy admins to `platform_super_admin`.
- Verify role + membership checks in all server handlers and corresponding database policies with actual authenticated sessions.
- Verify `/api/triage/stats` and all other queue APIs reject missing or unauthorized tenant scope at both API and database layers.
- Verify patient ownership and active hospital/department scoping in PostgreSQL. There is not yet a workflow to link a private patient assessment to a hospital or staff case.
- Review actor identity is derived from `auth.uid()` by the authored migration trigger; implement and verify an append-only audit event trail.
- Ensure exports, search, counts, and any future realtime subscriptions are tenant- and permission-scoped.

### Data protection

- The legacy in-memory store and sample values remain for isolated unit tests only; clinical API routes no longer use it. Keep all fixtures synthetic and remove/anonymize them before any production workflow.
- Do not collect or persist actual health data until there is durable access-controlled storage, consent/purpose and retention decisions, backups, audit logging, incident handling, and privacy/legal review.
- Define field minimization, encryption-at-rest/in-transit assurances for chosen hosting, retention, deletion, portability, and access review.
- Build private upload with size/type/content validation, malware scanning, unguessable object identifiers, signed short-lived access, and hospital/patient authorization before enabling attachments. Current API only handles metadata/text.
- Do not put clinical text, patient identifiers, tokens, passwords, publishable/service keys, or full Auth/database error details in client responses or general logs.

### Authentication and platform controls

- Email verification is required in the observed Auth settings; sign-ups and email provider are enabled. The exact Redirect URL allowlist and actual email delivery remain dashboard/operator verification tasks.
- Add rate limiting/abuse controls for registration, login, recovery, translation, and intake; document account recovery and support procedures.
- Review MFA support and enforcement by role, session expiry/revocation, CSRF posture for mutation endpoints, and secure headers for the chosen deployment.
- Centralize structured logs with correlation/request IDs and redaction. Avoid logging request bodies; security audit events are not debug logs.
- Establish least-privilege developer/operator access, secret rotation, backup/restore verification, alerting, and an incident response process.

### Clinical safety and integrity

- `lib/triage-engine.js` is keyword/threshold/rule logic, not a validated AI model. The misleading “confidence” percentage was removed. It can suggest response times, tests, and treatment-like actions; do not present it as validated clinical advice or use its output to independently assign final urgency.
- Adopt no clinical thresholds or treatment recommendations in Phase 2. First obtain a protocol, clinical governance, validation, versioning, and change-control process approved by qualified clinical stakeholders.
- Use clinician-authenticated actor IDs and append-only change history for assessments, overrides, and workflow transitions.
- Clearly separate triage assistance from diagnosis/clinical decisions; include human review and emergency escalation wording approved by clinical owners.

## Required tests / release gates

1. Registration cannot submit or mutate roles; newly created user/profile role is `patient`.
2. Existing admin/clinician account role values remain unchanged through every migration.
3. Anonymous access is denied for all private API operations and all tenant tables.
4. Hospital A member cannot read/write Hospital B records, including via guessed IDs, filters, nested relations, exports, aggregate stats, or alternate endpoint paths.
5. Patient A cannot access Patient B records; authorized representative grants are explicit, scoped, revocable, and separately tested if built.
6. Hospital administrators cannot administer hospitals outside active membership.
7. Role/membership revocation takes effect on subsequent requests; test stale sessions and concurrent updates.
8. RLS tests use actual database/JWT roles against a non-production Supabase project. Unit mocks alone are insufficient.
9. Sensitive mutations produce an audit row with correct actor/resource/hospital/action; app users cannot update/delete audit history.
10. Input size, malformed JSON, enum/ID validation, rate limits, file upload constraints (if implemented), and errors are tested.
11. Backups restore to an isolated project and migrations are tested forward and through documented recovery steps.
12. Clinical rules are not enabled for real care until validated/approved and the UI is evaluated with intended users.

## Privacy / regulatory boundary

This plan does not assert compliance with India's Digital Personal Data Protection requirements, healthcare laws, ABDM, FHIR, HIPAA, or any certification. Jurisdiction, controller/processor obligations, consent and notice content, data localization/transfer, retention, data-subject workflows, and interoperability require qualified legal, privacy, security, and healthcare review. Do not advertise integration or compliance until independently verified.

## Security approval gates

- No Phase 2 production migration before a read-only inventory of the real Supabase schema/policies and a backup.
- No migration that drops/recreates users, profiles, roles, or clinical data; no weakening of RLS.
- No role promotion without documented identity and authorization review.
- No clinical records or external integration enablement based solely on a successful build.
- No deployment or billing activation from development work.