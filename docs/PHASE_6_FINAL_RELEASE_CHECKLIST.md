# TriageX Phase 6 — Final Release Checklist

**Final status: NOT READY — BLOCKING ISSUES REMAIN**
**Review date:** 2026-11-10

## Application and data

- [x] Existing project architecture inspected; no rewrite or production database changes.
- [x] Existing demo limitations documented in README.
- [x] Generated, uncalibrated AI confidence percentage removed.
- [x] Metadata-only images no longer produce claimed visual analysis or change urgency.
- [x] Clinical review attribution derives from the verified Supabase user ID.
- [x] Move clinical API routes from the shared in-memory store to Supabase-backed assessment operations with owner/tenant identifiers and RLS policies in a new migration.
- [ ] Apply and verify the new assessment schema/RLS in a disposable Supabase project before relying on database isolation.
- [ ] Establish patient-to-auth identity and authorized representative rules.
- [x] Require explicit active hospital/department assignments for staff-created clinical cases; keep patient self-assessments private and unlinked to a hospital.
- [ ] Implement and verify durable append-only clinical state/audit transitions.
- [x] Add doctor registration and pending/approved/rejected/suspended application UI using existing Supabase Auth.
- [x] Add a private credential bucket with owner/reviewer policies, size/type/signature checks, and short-lived reviewer links.
- [x] Restrict approvals to explicit hospital/organization/platform review grants; approval assigns a hospital membership and department-scoped `doctor` grant.
- [x] Keep doctor applicants on the existing patient profile role until explicit approval; legacy `admin` roles receive no implicit reviewer grants.
- [ ] Apply and verify `20261110000400_doctor_registration_approval.sql` in disposable Supabase; it has not been applied.
- [ ] Verify configured explicit reviewer assignments and user notification/email delivery; no email notification provider is configured.

## Security and database

- [x] Legacy `admin` role is not automatically mapped to new tenant/platform roles in the additive migration.
- [x] Clinical API source no longer grants tenant access from legacy `clinician`/`admin` profile roles alone.
- [ ] Verify and apply the tenant and assessment migrations in a disposable Supabase project only.
- [ ] Execute JWT-backed RLS tests for patient, staff, hospital, organization, platform, department, revocation, suspension, and cross-tenant cases.
- [x] Integrate explicit tenant checks and Supabase-backed operations into clinical routes; database enforcement remains unverified.
- [ ] Execute patient-to-patient isolation tests against the new assessment schema.
- [ ] Run the doctor onboarding pgTAP additions and authenticated registration/review/document-access API workflows in disposable Supabase.
- [ ] Verify secure credential document storage, reviewer access, document expiry, approval, rejection, suspension, and revocation at the database/API layers.
- [ ] Implement and test rate limiting and abuse controls.
- [ ] Review/test CSRF and Origin behavior for all cookie-authenticated mutations.
- [ ] Implement durable append-only audit logging for clinical mutations.
- [ ] Verify remote Supabase grants, triggers, policies, backup, and restore.

## Clinical and privacy

- [x] Remove false AI confidence output and clarify the non-validated demo.
- [ ] Obtain qualified clinical approval/validation of intended use, rules, warnings, output, and workflow.
- [ ] Review emergency escalation and risk of false reassurance with clinical owners.
- [ ] Implement consent, purpose limitation, minimization, retention, deletion/correction, access review, and incident workflows.
- [ ] Obtain qualified legal/privacy review for applicable Indian requirements and any healthcare/medical-device obligations.
- [ ] With qualified counsel, determine applicability and implementation requirements under India's Digital Personal Data Protection Act and applicable rules, including notice, lawful purpose/consent, data minimization, rights and grievance handling, children's data if relevant, retention/deletion, processors, cross-border handling, and breach response.
- [ ] With qualified counsel and clinical owners, determine whether medical-device, clinical decision-support, telemedicine, professional-practice, health-record, or other sector rules apply to the intended product and deployment.
- [ ] Do not accept real patient data until storage and access controls are independently verified.

## Tests and operations

- [x] Run final `npm test`, `npm run lint`, and `npm run build` after doctor onboarding changes (`npm test`: 37 passed, 1 opt-in test skipped; lint and build passed).
- [ ] Run the 69-assertion pgTAP tenant/assessment/doctor-onboarding suite against disposable Supabase.
- [ ] Run authenticated API integration and patient/doctor/admin E2E journeys.
- [ ] Verify browser behavior on desktop, tablet, and mobile.
- [ ] Exercise production-like failure handling, session expiry, monitoring, alerts, and backup restore.
- [ ] Confirm separate staging project, safe migration history, deployment configuration, and release runbook.
- [ ] Obtain explicit production release authorization after all gates pass.

## Go/no-go

**No-go.** The app remains a demonstration. New tenant/assessment/doctor-onboarding migrations and RLS policies are unapplied and unverified, authenticated tenant and doctor API tests did not run, and clinical safety/legal/privacy/operational review is incomplete. Do not represent the project as production-ready or process real patient information.
