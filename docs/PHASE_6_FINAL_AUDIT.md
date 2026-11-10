# TriageX Phase 6 — Final Application Audit

**Audit date:** 2026-11-10
**Status:** Local tenant-isolation and doctor-approval implementation added; database and release gates not verified.
**Scope:** Checked-in Next.js application, Supabase helpers and migrations, triage rules/store, API routes, current tests, README, and local deployment configuration. No production service or database was changed.

## Executive summary

TriageX is a Next.js healthcare triage demonstration with Supabase email/password authentication and preferences, a deterministic keyword/rule engine, browser speech recognition, optional server-side Google Translation, and sample clinician/patient interfaces. It is not a production clinical record system or a tenant-isolated healthcare SaaS platform.

The previously shared in-memory store is no longer used by the clinical API routes. The local implementation now separates private patient-owned assessments from staff cases requiring an explicit hospital/department grant, and adds Supabase RLS policies and database-backed queue, review, and analytics paths. The additive assessment migration and RLS tests remain unexecuted; no disposable database configuration or PostgreSQL/Supabase tools are available. Database isolation is therefore not verified.

**Release decision: NOT READY — BLOCKING ISSUES REMAIN.** A passing unit suite, lint, and build do not establish database isolation, safe clinical use, privacy compliance, or production readiness.

The doctor onboarding source now uses the existing Supabase Auth flow, leaves new accounts on the patient profile role, stores applications in a private RLS-controlled schema, and grants department-scoped doctor access only through a reviewer-authorized transaction. Credentials use a private Supabase Storage bucket and short-lived reviewer links. The migration and its pgTAP additions are unexecuted; no doctor account, reviewer grant, credential, or production database was modified.

## Implementation inventory

| Area | Verified implementation | Limitation / status |
|---|---|---|
| Web application | Next.js 16 App Router and React; public information pages, homepage, intake, clinician dashboard, analytics, settings, login/register/recovery | No verified staging or production deployment |
| Authentication | Supabase SSR session; email/password registration, login, reset, logout; role loaded from `profiles` | Hosted Auth configuration, redirect allowlist, email delivery, expiration, and live account flows not tested |
| Roles | Legacy profile roles remain unchanged; signup defaults to patient; clinical access uses explicit tenant grants | Legacy `clinician`/`admin` does not implicitly grant tenant or platform access |
| Doctor onboarding | Auth account, pending application, status page, explicit reviewer dashboard, private credential upload, approval/rejection/suspension | Depends on unapplied migration; no credentials verified and no email notifications configured |
| Database | Profile/preferences/privacy migrations, tenant foundation, assessment RLS, and doctor application/credential migrations | New tenant migrations and policies are unapplied/unverified in a disposable database |
| Patient portal | Preview dashboard with sample metrics and explicit sample labels | No authenticated patient health record or assessment history |
| Clinical intake | Validated private patient intake or explicitly authorized hospital/department case | Staff cases have no patient-account link; clinical validity is not established |
| Clinician queue | Supabase-backed, RLS-filtered queue, detail, review, simulation, stats, and scoped CSV export | Requires new migrations and explicit grants; not database-tested; no append-only clinical audit |
| Analytics | Current tenant/department counts and CSV export | Historical chart lines remain illustrative client-generated sample trends |
| Speech/translation | Browser Web Speech API; server-side Google Translation when configured plus dictionary fallback | Google Cloud Speech-to-Text is not implemented; browser recognition availability varies |
| Images/reports | Illustrative image metadata presets; pasted report text and sample text presets | No image upload, image model, file storage, or OCR; report parsing is unvalidated keyword matching |
| Notifications/contact | Preference flags and informational contact page | No notification delivery or monitored contact submission endpoint |
| Tests | Node test suite for pure helpers and rules; 69-assertion pgTAP suite; opt-in API smoke test | Local: 37 passed, 1 opt-in API test skipped; lint and production build passed; pgTAP and authenticated API tests not run |

## Route and API audit

Pages include `/`, `/about`, `/analytics`, `/contact`, `/dashboard`, `/forgot-password`, `/health-info`, `/intake`, `/login`, `/patient-dashboard`, `/register`, `/reset-password`, `/services`, `/settings`, and `/unauthorized`.

The API surface includes account preferences/privacy; auth registration, login, logout, current-user, recovery, password reset/change; and triage intake, queue, patient detail, review, simulation, statistics, and translation.

Added routes include `/register/doctor`, `/doctor/application`, `/doctor/dashboard`, `/admin/doctor-applications`, plus authenticated doctor application/facility and reviewer/document APIs. Review APIs require explicit current tenant administrator or platform reviewer authorization. Legacy `admin` does not grant application-review access.

- Clinical APIs authenticate through Supabase SSR. Hospital/department scope is verified with explicit tenant RPCs and rechecked by RLS; queue, details, reviews, simulation, and statistics no longer import the process-local store.
- Private assessments use the authenticated patient's own user ID. Staff-created cases require explicit hospital and department IDs and ignore caller-supplied facility names for authorization.
- The new route to list authorized hospitals/departments uses Supabase row security and exposes only access metadata needed by the intake, dashboard, analytics, and navigation UIs.
- Database ownership constraints, read/insert/update policies, restricted update columns, and review actor stamping are defined in the new migration but have not been executed.
- No patient-to-hospital identity-linking workflow exists. Patient self-assessments are not shared with a clinical queue; staff-entered cases have no patient-account owner.
- Review actor attribution is sourced from `auth.uid()` in the migration trigger, but the workflow is not an immutable append-only clinical audit.
- Doctor application submissions and state changes have a separate append-only audit table; account creation is recorded when the existing Auth flow carries a doctor registration intent. Application RLS and storage policies remain unverified until the migration is applied and tested.
- Doctor approvals create an explicit hospital membership and a department-scoped `doctor` grant; rejection/suspension revoke active doctor grants. Approving/reviewing one's own application is rejected in the transactional RPC.

## Issues fixed during this audit

1. Removed the generated `aiConfidence` percentage. It was a fixed baseline plus input-presence arithmetic, not a calibrated model confidence.
2. Image metadata no longer generates claimed visual findings or changes triage urgency. The UI now states that image scenarios are illustrative and no image is uploaded or analyzed.
3. Review attribution now comes from the authenticated user ID rather than the client-supplied `reviewedBy` field; malformed JSON objects are rejected.
4. The demo result is explicitly described as rule-based, unvalidated, and not a diagnosis. README documentation distinguishes the demo from real clinical workflows.
5. Anonymous access to the clinical statistics endpoint was closed in the earlier Phase 2A work; local anonymous requests to stats and queue returned 401 at that time.
6. Clinical API reads/writes were moved from global process memory to explicit owner/tenant-scoped Supabase operations. Legacy roles no longer give implicit hospital access. This is a local implementation only until the new migration and authenticated RLS/API tests pass.

## Release blockers

- New tenant and clinical-assessment SQL remains unapplied and untested in a disposable PostgreSQL/Supabase environment.
- Doctor application and storage migration, private-bucket policies, and its 65-assertion pgTAP coverage remain unexecuted; reviewers need explicit tenant/platform assignments provisioned through a trusted process.
- No notification delivery or malware-scanning service is configured. Credential authenticity remains a human review responsibility; the product makes no claim that documents are verified automatically.
- No authenticated API/RLS integration test has run; local source changes do not prove actual database isolation.
- No patient-to-hospital linking workflow, durable append-only clinical mutation audit, rate limiting, retention, recovery, monitoring, or incident-response verification.
- Heuristic thresholds, urgency mappings, report patterns, diagnostic suggestions, and care pathways are not clinically validated.
- No production-grade audit, retention, recovery, rate limiting, monitoring, or incident-response verification.
- No independent legal/privacy/clinical review or staging deployment verification.

## Configuration and data handling

The README and `.env.example` describe the public Supabase URL/key and app URL. `.env*` files are ignored. The configured local `.env.local` was not printed or copied into this report. There is no test-only `.env.test*` configuration, disposable database connection, Supabase CLI, PostgreSQL client, Docker, or Podman available. Do not treat the configured application project as a disposable target or run migrations/tests against it.

## Audit boundaries

This was a source and local-command audit, not a penetration test. The browser tab supplied for UI inspection was unavailable (`chrome-error://chromewebdata/`), so desktop/tablet/mobile visual and interactive verification was not performed. Remote Supabase state, production environment, backup/restore, rate limits, file infrastructure, and deployed headers were not independently inspected.

See [PHASE_6_SECURITY_REVIEW.md](./PHASE_6_SECURITY_REVIEW.md), [PHASE_6_CLINICAL_SAFETY_REVIEW.md](./PHASE_6_CLINICAL_SAFETY_REVIEW.md), and [PHASE_6_TEST_REPORT.md](./PHASE_6_TEST_REPORT.md).
