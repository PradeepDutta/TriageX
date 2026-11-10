# TriageX project audit

**Audit date:** 2026-11-10
**Phase:** 1 audit with Phase 2 foundation progress
**Repository state:** The workspace path did not contain a Git repository, so this audit could not compare against tracked history. No application or database code was changed as part of this phase.

**Historical snapshot:** This document records the Phase 1 baseline and early Phase 2 status. The latest implementation and verification status is in [PHASE_6_FINAL_AUDIT.md](./PHASE_6_FINAL_AUDIT.md); do not use the baseline descriptions below as current route/schema state.

## Executive summary

TriageX is a Next.js 16 App Router JavaScript demonstration with a polished healthcare UI, Supabase Auth integration, account preferences, rule-based triage prototypes, and sample dashboards. It is **not currently a multi-hospital system or a production clinical record system**.

The most important architecture boundary is that account identity and settings are persisted in Supabase, while triage cases, queue review state, and their derived analytics live in a module-level in-memory JavaScript array. That store is seeded with patient-like names, contact details, clinical narratives, vitals, and treatment-like notes. It is neither durable nor isolated by account or hospital, and must remain synthetic-only. Authentication gates do not change this data model into a tenant-secure clinical workflow.

At the Phase 1 audit, no organization, hospital, department, membership, patient-record, appointment, admission, bed, referral, subscription, or audit-log tables were present in the inspected migrations. An unapplied Phase 2 migration now defines the tenant hierarchy, memberships, explicit grants, RLS, and access audit table. There is still no tenant identifier or hospital membership check in current clinical APIs, and no clinical records are tenant-scoped.

## Phase 2 progress note

The workspace now contains an additive, unexecuted tenant foundation migration and server-side authorization helpers for explicit platform, organization, and hospital grants. Existing `admin` role values remain unchanged and confer no new tenant privilege. Unit tests cover the helper's accepted role scopes and reject legacy roles as tenant grants. The migration has not been applied or tested against PostgreSQL/Supabase, and tenant checks are not connected to existing clinical routes. The Phase 2 exit gate remains unmet.

## Inspected scope

- `package.json`, project configuration, environment-variable names, and `.gitignore`.
- All App Router route directories, pages, API handlers, shared UI components, and the global stylesheet inventory.
- Supabase server/session helpers, the Next.js 16 `proxy.js`, both SQL migrations, and account/role access patterns.
- Triage engine, in-memory triage store, simulation generator, translation service/dictionary, and the associated automated tests.
- README and the five existing `docs/*.md` files. Those five documentation files were empty before this audit.
- `npm test`, `npm run lint`, and `npm run build`.

Environment inspection was limited to whether variable names are set. Credential values were not read into this document or printed. The workspace currently has the Supabase site URL, project URL, and publishable key configured in its ignored local environment file; no service-role key, Google Translation key, or Google credentials variable was configured at audit time. This is only an environment snapshot, not evidence that deployed secrets are configured correctly.

## Stack and structure

| Area | Current implementation |
|---|---|
| Web framework | Next.js 16.4.6 App Router; React 19; JavaScript/ES modules |
| UI | Shared React components and a large global CSS stylesheet; Tailwind/PostCSS packages are installed, but the inspected UI styling is primarily handwritten CSS |
| Authentication | `@supabase/ssr` and `@supabase/supabase-js`; server cookie session helpers; Supabase Auth email/password |
| Database | Supabase Postgres is used by profile lookups, user preferences, and privacy requests, subject to migrations having actually been applied |
| Clinical records | In-memory module state in `lib/triage-store.js`; resets when process restarts and is not shared consistently across multiple server instances |
| Charts | Inline SVG/custom chart components in analytics and patient preview; no Recharts dependency was found |
| Voice | Browser Web Speech API in the intake client; no Google Cloud Speech-to-Text route was found |
| Translation | Server API uses Google Cloud Translation v2 when a key is configured; dictionary fallback otherwise |
| Tests | Node built-in test runner; 17 passing unit tests at audit time |
| 3D | Three.js/Spline dependencies and `CyberHeart3D.js` exist; the inspected homepage renders a static optimized doctor image, not the standalone CyberHeart component |

Primary areas: `app/` contains pages, client components, and route handlers; `lib/` contains business rules, in-memory state, and Supabase helpers; `supabase/migrations/` contains two account-related migrations; `public/` contains brand and image assets; `tests/` contains engine, translation, store, CSV, and preference tests.

## Functionality status

### Present in code and covered to some extent

- Homepage, shared navigation/footer, health-information pages, responsive styles, and light/dark appearance.
- Registration form and API; Supabase Auth email/password login, callback, password recovery/reset/change, logout, and account profile role lookup.
- Preferences UI/API for theme, language, notifications preferences, accessibility, and voice language; preference and privacy-request tables have user-scoped RLS policies in the migration.
- New account profile trigger is defined to assign the `patient` role. Registration does not accept a role field.
- Server-rendered page guards for settings/intake and clinician/admin dashboard/analytics, plus API checks for queue, patient detail, review, simulation, intake, and translation.
- Rule-based triage and human override prototype; speech input when supported; translation behavior has unit tests.
- Existing sample patient dashboard and metrics are explicitly labelled preview/sample data.

These features passing a build or unit test does not certify their integration with a live Supabase database or their suitability for clinical operations. End-to-end registration, email verification, password recovery, saved preferences, role promotion, and live RLS behavior were not exercised in this audit.

### Demonstration-only or incomplete

- The clinician queue, detail, review, triage record, initial cases, and simulation use process-local in-memory state. The seeded records include patient-like demographics/contacts and treatment-like notes; they are not sourced from verified hospital data and should not be treated as real or clinically approved.
- Analytics includes sample historical volume/response series and derives other summary metrics from the same in-memory/demo store. Some labels are presented as operational metrics despite the demo data source; they are not verified hospital performance measures.
- Patient dashboard is a static preview with illustrative values and chart, not a logged-in patient record view.
- “Find Nearby Help” is facility selection/listing, not a geolocation or live directory integration.
- Notification controls store preference flags only. No delivery service exists.
- Deletion is an administrator-review request, not automated deletion. Session control is global sign-out, not a session inventory.
- Contact has no monitored submission endpoint. Google OAuth, Google Speech-to-Text, scheduling, billing, FHIR/ABDM, laboratory, pharmacy, and external hospital integrations are not present.
- A simulated intake endpoint exists and generates artificial data; simulation is not an external integration.

## Confirmed gaps and risks

| Priority | Finding | Evidence and impact |
|---|---|---|
| Blocker for real clinical use | Clinical data is not persisted or tenant-isolated | `lib/triage-store.js` holds a module-level array and seeds sample cases. User identity/hospital is not attached to cases. Process restarts lose new records; instances can disagree. Do not enter real patient information. |
| Blocker for multi-hospital launch | No tenant data model | The migrations define profiles/preferences/privacy requests only. No organizations, hospitals, memberships, departments, patients, hospital IDs, or tenant RLS policies exist. |
| High | Patient and staff roles are too coarse for least privilege | `profiles.role` permits only `patient`, `clinician`, `admin`. Dashboard/API authorization grants both `clinician` and `admin` broad global access; no hospital or department membership is checked. |
| High | Aggregate stats route has no explicit role guard | `app/api/triage/stats/route.js` returns facility and triage-derived statistics without `requireRole`, although the dashboard itself is role-guarded. It currently reports demo-store data, but should be reviewed before database-backed stats are added. |
| High | Patient intake is not patient-record ownership | Any authenticated patient can submit arbitrary patient details to `app/api/triage/intake/route.js`; the submitted record is not linked to the Supabase user. The endpoint trusts client-supplied `isSimulated`; no consent, patient ownership, organization, or hospital membership is recorded. |
| High | Clinician review identity is client-supplied | `app/api/triage/review/[id]/route.js` accepts `reviewedBy` from the request and stores it in memory. It does not record an authenticated actor ID or append-only audit event. |
| High | Triage logic is heuristic and medically unvalidated | `lib/triage-engine.js` uses keyword, substring, hard-coded vital thresholds, score weights, and report-text regexes. It generates response-time targets, escalation language, investigation suggestions, and a synthetic “AI confidence” percentage. These are not evidence of a validated protocol or AI model. Do not use for clinical decisions. |
| Medium | Database and Auth configuration is only partially observable from the app | Migrations define the `profiles.id → auth.users.id` FK, trigger, and RLS policies, but whether they ran in the hosted project was not checked because no database administrative connection was supplied. Public Auth settings confirmed sign-up enabled and email confirmation required; redirect allowlist and email delivery are configured in the Supabase dashboard and were not verifiable from the public endpoint. |
| Medium | Route-level/API test coverage is missing | Existing tests cover pure helpers and store logic; no automated route-handler integration, Supabase/RLS, auth, role, or cross-tenant tests were found. |
| Medium | Rate limiting and operational controls are not implemented in application code | Auth and intake endpoints have validation, but no app-level throttling, abuse monitoring, alerting, backup/restore runbook, or recovery test exists in the inspected files. Supabase service-side limits were not audited. |
| Medium | Demo seed and simulation content risks confusion | Names, phone-like contacts, detailed case narratives, test-result strings, and treatment notes are embedded in `lib/triage-store.js`; flags are inconsistent across seeded cases. Keep out of production and replace with clearly synthetic fixtures before portfolio/public demos. |
| Low | Documentation and UI promise more than the integrations provide | README correctly notes several demo limitations, but it contains an outdated environment-variable name in setup instructions (`NEXT_PUBLIC_SUPABASE_ANON_KEY` while the local config also supports the newer publishable key), and is not a full deployment/operator guide. |
| Low | Duplicate/unused implementation surfaces | `lib/translation-service.js` and `lib/translation-dictionary.js` both define dictionaries/translation behavior; the active API uses the latter plus its own Google request. `CyberHeart3D.js` and its dependencies are present but were not found in the homepage import path. Review before deleting or consolidating. |

No evidence was found for secure patient document upload; the intake accepts image metadata/text fields rather than implementing a private storage upload pipeline. No migration or code changes were made to “fix” these risks during this audit phase.

## Existing database/auth model

`profiles` references `auth.users(id)` and allows the legacy roles `patient`, `clinician`, and `admin`. The profile trigger runs as `SECURITY DEFINER` with an empty `search_path`, inserts a patient role, and does not grant users direct profile write privileges in the migration. User preferences and privacy requests each have RLS enabled and policies scoped to `auth.uid()`. There are no organization-level RLS policies because there is no organization schema.

The second migration repairs/ensures the auth foreign key and recreates the profile trigger with `ON CONFLICT DO NOTHING`, preserving existing profile rows and roles. Neither migration was applied by this audit. Do not infer the remote schema from checked-in SQL alone.

## Verification run

| Command | Result |
|---|---|
| `npm test` | Pass — 17 tests |
| `npm run lint` | Pass |
| `npm run build` | Pass — Next.js production build |
| Live Auth/RLS/tenant tests | Not run; no account or database admin connection/test fixture was supplied |

## Phase 1 conclusion

Retain Next.js, Supabase Auth, Postgres, JavaScript, and the current visual identity. Do not extend the in-memory clinical store into a larger production workflow. Before organization dashboards or hospital operations are built, approve a tenant/role model, add additive reviewed migrations, and prove tenant authorization at both the SQL RLS and route layers with automated cross-tenant tests. See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [DATABASE_DESIGN.md](./DATABASE_DESIGN.md), [SECURITY_PLAN.md](./SECURITY_PLAN.md), and [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md).