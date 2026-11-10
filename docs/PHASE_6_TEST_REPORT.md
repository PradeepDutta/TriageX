# TriageX Phase 6 — Test Report

**Run date:** 2026-11-10
**Environment:** Local project workspace; no disposable Supabase settings or DB tooling.
**Interpretation:** Passing local checks do not prove database, tenant, clinical, or production safety.

## Executed commands

| Command | Result |
|---|---|
| `npm test` | **Passed:** 37 tests passed; 0 failed; 1 skipped (opt-in API smoke test requires `TRIAGEX_TEST_API_BASE_URL`). 38 tests total. |
| `npm run lint` | **Passed** |
| `npm run build` | **Passed**; Next.js production build compiled and generated the route manifest, including doctor and reviewer routes. |

Local tests cover account preferences, CSV generation, translation, triage logic, private/tenant assessment row construction, owner/creator omission from API mappings, tenant role input validation, legacy-role distinction, review actor attribution, doctor application/file validation, private response mapping, and doctor auth redirects.

## Not run / blocked

- `supabase/tests/multitenancy_foundation.test.sql`: not run. It plans 69 pgTAP assertions, including doctor account audit, duplicate registration number rejection, reviewer scoping, self-approval denial, approval grants, document authorization helper, legacy admin isolation, suspension, and doctor grant revocation. No PostgreSQL/Supabase CLI or disposable DB connection is available.
- `tests/triage-api-auth.integration.test.mjs`: skipped because no disposable test app URL was configured for the runner.
- Authenticated user journeys for patient, doctor, hospital admin, organization admin, platform admin, and legacy admin: not run.
- Tenant membership, role revocation, suspended organization, department access, and cross-hospital RLS: SQL coverage is authored but not executed.
- Patient-to-patient data isolation: source policies and test fixtures are authored but not executed against PostgreSQL.
- Upload/download, OCR, file storage, rate-limit, CSRF, database failure, backup/restore, and session-expiration tests: not run or not implemented.
- Doctor registration, duplicate account, live Supabase upload, reviewer approval/rejection/suspension, and signed-document API journeys: not run.
- E2E test command is not configured in `package.json`.
- Responsive desktop/tablet/mobile browser validation: not completed; supplied browser page was unavailable during audit.

## Test evidence and interpretation

The project test command is the Node built-in test runner. The opt-in API test covers only anonymous denial for the listed triage endpoints; it does not prove access controls for authenticated roles or tenant data and was skipped because no test URL was configured. The pgTAP test is transactional and must be run only in a disposable database after confirming the prerequisite extensions and migration schema. Do not run it or apply migrations to production.

No test-only `.env.test*` configuration, database connection, PostgreSQL/Supabase CLI, Docker, or Podman was available. Anonymous API behavior was not rechecked against a running server after the tenant-route changes. The Phase 2A/Phase 6 database exit gate remains unmet; run the authored SQL and authenticated API tests against a separately provisioned disposable Supabase project before considering release.
