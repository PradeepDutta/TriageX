# TriageX

**Smart Triage. Better Care.**

TriageX is a Next.js healthcare triage demonstration. It collects patient-reported symptoms and available vital signs, applies configured triage rules, and presents an explainable assessment for clinician review. It is decision support, not a diagnosis or a replacement for professional medical judgment.
## Application Screenshot
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/19622d3f-1a66-4d05-9f38-08292e520918" />

## What works in this project

- Guided patient intake with symptom text, optional vital signs, a private patient assessment path, and an explicitly assigned hospital/department case path for authorized staff.
- Synthetic heuristic examples for urgency/red-flag display; these rules are not clinically validated and must not guide patient care.
- Browser speech recognition where supported, with typed input as a fallback.
- Server-side Google Cloud Translation integration when configured, plus a built-in clinical translation dictionary fallback.
- Tenant-scoped clinician queue with search, filters, review, and triage updates when the required Supabase migrations and explicit grants are configured.
- Department-scoped analytics and CSV export.
- Public information pages for services, health information, about, and contact.
- Supabase-backed patient registration, email verification, login, password recovery, global sign-out, and account preferences (available after configuration).
- Doctor applications with private credential uploads, reviewer-scoped approval, explicit hospital/department role grants, rejection, and suspension (requires the new unapplied migration).
- Server-verified roles for clinical dashboard and triage APIs; self-registration always creates a patient account.

The homepage vitals are illustrative sample values, not live monitoring. The clinician queue is not a patient portal.
The patient dashboard preview also uses illustrative data and is not connected to a patient account or health record.
Clinical APIs now target an additive Supabase assessment table protected by owner and hospital/department RLS. Patient-created assessments are private to the signed-in patient; cases submitted to a clinic require a verified active hospital/department grant. The previous process-local store is retained only for isolated unit tests and is no longer used by clinical API routes. The new schema migration is unexecuted and its RLS behavior has not been verified against a disposable database, so do not treat these local code changes as proof of isolation or use real patient information. The intake's visual presets do not upload or analyze images. Report text uses unvalidated keyword rules and does not provide OCR. The contact page does not collect messages because no monitored contact endpoint is configured.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | TriageX overview and feature information |
| `/intake` | Patient triage intake and assessment |
| `/dashboard` | Clinician queue and case review |
| `/patient-dashboard` | Patient-facing dashboard preview with sample-only metrics |
| `/analytics` | Triage analytics and CSV export |
| `/services` | Overview of connected platform workflows |
| `/health-info` | Safety and health-information guidance |
| `/about` | TriageX approach and limitations |
| `/contact` | Available support and safety guidance |
| `/login` | Supabase patient sign-in |
| `/register` | Patient account registration |
| `/register/doctor` | Doctor account and credential application |
| `/doctor/application` | Authenticated application status |
| `/doctor/dashboard` | Approved, hospital-scoped doctor clinical dashboard |
| `/admin/doctor-applications` | Explicitly authorized hospital/organization/platform application review |
| `/forgot-password` | Email-based password recovery |
| `/reset-password` | Set a password from a valid recovery link |
| `/settings` | Account preferences and security controls |
| `/unauthorized` | Role-restricted route information |

## Configure account access

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL` to the exact app origin, `NEXT_PUBLIC_SUPABASE_URL` to the project URL, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the project's publishable/anon key. Never put a Supabase service-role key in the application environment.
3. For local verification, use a separate disposable Supabase project and review/apply migrations in filename order: `20261110000000_account_preferences.sql`, `20261110000100_repair_patient_profile_trigger.sql`, `20261110000200_multitenancy_foundation.sql`, `20261110000300_tenant_scoped_triage_assessments.sql`, and `20261110000400_doctor_registration_approval.sql`. Do not apply the tenant or doctor migrations to production; their database tests have not yet been executed.
4. In Supabase Auth URL configuration, allow the local and deployed app origins and add `${NEXT_PUBLIC_SITE_URL}/auth/callback` as a redirect URL. Configure an email provider for verification and password-recovery links.
5. Restart the Next.js server after changing environment variables. Register a patient account and verify its email before signing in.
6. Patient and doctor sign-up both retain the existing patient profile role. Doctor applicants have no clinical role until a hospital/organization administrator or explicitly granted platform reviewer approves them. Legacy `admin` profiles do not automatically receive review or platform access; provision reviewer grants explicitly through an approved trusted administrative process.

The intake, queue, detail, review, simulation, and statistics APIs use Supabase-backed records and explicit tenant context in the local implementation. They fail closed when tenant authorization or the required schema is unavailable. Actual database enforcement remains unverified until the migrations and pgTAP suite run in a disposable Supabase project. Private patient assessments are not automatically linked to a hospital queue; staff-entered cases have no patient-account link unless a trusted assignment workflow is added. Preferences and privacy requests remain account-scoped by RLS, subject to the migrations being applied. Google sign-in, notifications delivery, automatic account deletion, and per-device session management are not configured; deletion is an administrator-reviewed request, and the session control signs out all devices.

Doctor credentials are uploaded to the private `doctor-credentials` Supabase Storage bucket with a 5 MB limit and PDF/JPEG/PNG type and signature checks. Reviewer links are short-lived and database/storage policies restrict access to the applicant and authorized reviewers for that hospital. Approval/rejection/suspension and account/application events are authored to an immutable audit table; this migration is unapplied and these controls have not been tested against Supabase. Email notifications are not configured; applicants see status after login.

This account system is a project integration, not a certification that the demo is compliant for protected health information. Use synthetic data only. The project is not ready for staging or production use for clinical workflows until the Phase 6 release gates in `docs/PHASE_6_FINAL_RELEASE_CHECKLIST.md` are cleared.

## Run locally

Use the Node.js version supported by the installed Next.js release.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: add `GOOGLE_TRANSLATE_API_KEY` to a server-side `.env.local` file to enable Google Cloud Translation. Keep the key restricted and out of client-side code and source control. The intake can still use the built-in clinical dictionary when the API is not configured.

## Voice recognition and translation

The intake currently uses the browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for voice transcription. Availability and language recognition depend on the browser; typed symptom input remains available as a fallback. The selected original transcript is sent to `/api/triage/translate`, which uses Google Cloud Translation when configured and the built-in clinical dictionary as a fallback. When a translation is available, English is shown before the original transcript and is included in the triage assessment.

**Google Cloud Speech-to-Text v2 is not currently called by this codebase.** Earlier setup notes described a Cloud Speech integration, but the existing intake uses browser speech recognition instead; no Cloud Speech route or credential handling is present. Do not configure Speech-to-Text credentials expecting them to enable the current voice flow.

## Checks

```bash
npm test
npm run lint
npm run build
```

## Phase 6 verification status

The Phase 6 audit and test evidence are documented in [`docs/PHASE_6_FINAL_AUDIT.md`](./docs/PHASE_6_FINAL_AUDIT.md), [`docs/PHASE_6_SECURITY_REVIEW.md`](./docs/PHASE_6_SECURITY_REVIEW.md), [`docs/PHASE_6_CLINICAL_SAFETY_REVIEW.md`](./docs/PHASE_6_CLINICAL_SAFETY_REVIEW.md), [`docs/PHASE_6_TEST_REPORT.md`](./docs/PHASE_6_TEST_REPORT.md), [`docs/PHASE_6_DEPLOYMENT_GUIDE.md`](./docs/PHASE_6_DEPLOYMENT_GUIDE.md), and [`docs/PHASE_6_FINAL_RELEASE_CHECKLIST.md`](./docs/PHASE_6_FINAL_RELEASE_CHECKLIST.md). The tenant migration remains unapplied; database tests require a disposable Supabase environment. Do not treat passing local unit tests or a production build as evidence of clinical, security, privacy, or regulatory readiness.
