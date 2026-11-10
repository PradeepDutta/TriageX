# TriageX Phase 6 — Security and Privacy Review

**Review date:** 2026-11-10
**Status:** Source review only; database, hosted configuration, and authenticated tenant testing are blocked. Not a security certification.

## Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-01 | HIGH | Clinical queue/detail/review APIs previously used a global in-memory patient collection with only legacy `clinician`/`admin` checks. | Locally addressed: clinical APIs now use an additive assessment table, patient-owner or explicit hospital/department context, server-side tenant checks, and RLS policies. Remains a release blocker until applied and tested in disposable Supabase. |
| SEC-02 | MEDIUM | The review API previously trusted the request's `reviewedBy` value, allowing reviewer spoofing. | Locally addressed: route ignores client attribution and a database trigger derives the actor from `auth.uid()`. Trigger/RLS behavior remains unexecuted; no append-only event trail exists. |
| SEC-03 | HIGH release blocker | The new assessment migration and RLS policies are unexecuted; database authorization and data isolation are not verified. | Open; run the pgTAP suite and authenticated API checks only in a disposable Supabase project. Never use production as a test target. |
| SEC-04 | MEDIUM release blocker | No rate limiting or abuse protection is implemented for authentication, recovery, translation, or intake endpoints. | Open; define and validate deployment-appropriate controls before public use. |
| SEC-05 | MEDIUM release blocker | No clinical mutation audit trail exists. Current triage review changes mutable process memory; the tenant migration's audit triggers concern tenant access metadata only and are not applied. | Open; require durable append-only actor/resource/action records and access review. |
| SEC-06 | LOW / informational | The application does not implement image upload or OCR, despite legacy labels. | Labels corrected locally; no file pipeline exists to test. |
| SEC-07 | HIGH release blocker | Doctor application and private credential storage controls depend on a new, unapplied migration. | Locally implemented with explicit reviewer checks, RLS/storage policies, private bucket, and transactional approval role grant. Must be validated in disposable Supabase before use. |

## Verified controls in source

- Supabase user identity is checked server-side using the SSR client.
- Signup does not accept a role; the checked-in account migration defines new profiles as `patient`.
- Existing legacy `admin` is not automatically inserted into the new platform grant table by the tenant migration.
- The new triage APIs no longer read from the process-local store. Private assessments are owned by the authenticated user; clinical queue cases require an explicit active hospital and department assignment.
- Queue, detail, review, intake, simulation, and statistics use the Supabase session client and are subject to database RLS; required tenant RPC failures return errors rather than granting fallback access.
- Review actor attribution is sourced from `auth.uid()` in the new migration trigger, while the API never accepts `reviewedBy` from the client.
- Auth cookies are configured `HttpOnly`, `SameSite=Lax`, path `/`; production cookie `Secure` is enabled based on `NODE_ENV`.
- A legacy `clinician` or `admin` profile role alone does not grant tenant queue or record access. New tenant roles require explicit grants.
- Preferences and privacy request data use account-scoped RLS in the checked-in migration, subject to that migration actually being applied remotely.
- Doctor registration uses the existing Supabase Auth account flow. Applicant metadata adds only a non-authorizing registration-intent marker; the existing profile trigger still creates the legacy `patient` role.
- Doctor application submission is session-bound; sensitive medical registration details are not copied into Auth metadata or application logs. A confirmation-required account must verify and sign in before the application data/document is submitted.
- Credential files are stored in a private bucket with a 5 MB cap, PDF/JPEG/PNG allowlist, server-side magic-byte checks, applicant-folder upload policy, and reviewer policies based on explicit hospital/organization/platform grants.
- Approval is a transactional RPC that rejects self-review, checks reviewer scope, activates/creates a hospital membership, and grants only the `doctor` role for an assigned department. Rejection/suspension records a reason, reviewer, timestamp, immutable audit event, and revokes active doctor grants.
- Pending/rejected/suspended doctor applications do not receive doctor grants. Login redirects to their application status; approved doctor dashboard access is checked again server-side through the existing tenant authorization RPC.
- Reviewer access is not inferred from `profiles.role = 'admin'`. Legacy admin accounts retain their existing profile values but need a separate explicit tenant/platform grant to review.
- `.env*` is gitignored. The local environment values were not revealed in this report.
- No service-role key was found in the checked-in client code during the source review.

## Authorization and data isolation

Legacy profile roles remain unchanged for compatibility. `admin` is not inferred as a platform or hospital role. New staff queue cases require a selected hospital and department with a current explicit tenant grant; self-intake records are private to the submitting patient and are not linked to any hospital queue. Staff cases deliberately have no patient-account link unless a trusted assignment workflow is added.

The new migration defines persistent rows, owner/hospital/department constraints, row-level policies, restricted update columns, and authenticated-actor review stamping. The migration is not applied and no PostgreSQL/Supabase tools or disposable test project are configured, so actual patient-to-patient, doctor-to-department, and cross-hospital isolation remains unverified. Local unit tests do not prove database authorization.

## API, input, and session notes

- Clinical routes require authenticated Supabase identity. Queue/statistics require explicit hospital and department context, and database RLS rechecks access on reads and writes.
- Intake validates field lengths and vital ranges. The server ignores client facility names for tenant authorization; private records are self-owned, while staff cases use a selected active hospital/department verified by RPC and RLS.
- The assessment IDs are random, but they are not authorization tokens; RLS is the access boundary.
- Review actor attribution is protected by restricted column grants and a trigger in the new migration; it is not an immutable append-only audit trail.
- The legacy in-memory store remains only for isolated unit tests and is not imported by the clinical API routes.
- Cookie `SameSite=Lax` is present, but there is no explicit origin/CSRF token policy documented or tested for mutation routes. No exploit was established in this source-only review; verify actual deployment behavior.
- No rate-limit implementation was found.
- No binary upload/storage endpoint or signed-download policy was found; image metadata is not an upload.
- The new doctor credential upload/review path has not been run against Supabase. MIME and signature checks are not malware scanning; PDFs/images still need an approved document-review and retention workflow. Reviewer email notifications are not configured.
- Server logs generally avoid client response detail, but a full log-redaction/PII review has not been performed. Do not submit real patient data.

## Verification not performed

- No JWT-backed RLS tests, disposable database migration application, or hosted schema/policy/grant/trigger inspection. The new doctor onboarding SQL has authored pgTAP cases but none were executed.
- No registration/login/recovery/session-expiration end-to-end flows.
- No live doctor registration, duplicate registration, reviewer approval/rejection/suspension, hospital membership assignment, signed credential access, or cross-hospital API test.
- No test of rate limiting, malware scanning, CSRF across deployment origins, security headers, backup restore, audit tamper resistance, or secret rotation.
- No production credential or infrastructure inspection.

The independent source review did not report a concrete exploit in the tenant SQL foundation but could not validate the SQL by executing it. Static review is not a substitute for running [multitenancy_foundation.test.sql](../supabase/tests/multitenancy_foundation.test.sql) as authenticated users against a disposable project.
