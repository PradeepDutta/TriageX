# TriageX Phase 6 — Controlled Deployment Guide

**Status:** Deployment preparation only. No deployment was performed or authorized.

## Current recommendation

Do not deploy the current clinical workflows to production or accept real health information. Clinical routes now use Supabase-backed owner/tenant-scoped assessments locally, but the additive schema and RLS migration have not been applied or verified against a disposable database. A successful Next.js build is not sufficient for release.

An isolated staging deployment may be considered only after the staging database and authentication configuration are separate from production and the security/clinical owners approve synthetic-only evaluation. Current Phase 6 status is **NOT READY** until the release blockers are closed.

## Environment separation

Maintain distinct development, disposable-test, staging, and production Supabase projects and app origins. Never point destructive tests or ad hoc SQL at production. Store environment files outside source control (`.env*` is ignored); do not paste secret values into chat or reports.

Application variables currently used:

| Variable | Purpose | Client exposure |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Exact application origin for auth redirects | Public |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (legacy anon-key alias is also accepted) | Public by design; rely on RLS |
| `GOOGLE_TRANSLATE_API_KEY` | Optional Google Cloud Translation v2 server request | Server-only |

Never add a service-role key to `NEXT_PUBLIC_*`, browser code, repository, logs, or this guide. A service-role key is not needed for normal user requests and bypasses RLS.

## Staging procedure (not executed)

1. Provision a separate Supabase staging project and synthetic-only accounts/data; verify project URL and project identity out-of-band.
2. Configure staging-only app origin, Supabase URL and publishable key, and any server-only translation credential. Verify URL configuration and email templates/redirect allowlists for staging.
3. Review the actual staging schema and migration history. Back up or snapshot the disposable environment.
4. Review and apply migrations in filename order to a disposable project only: account preferences, patient-profile trigger repair, multitenancy foundation, tenant-scoped triage assessments, then doctor registration/approval. Run `supabase/tests/multitenancy_foundation.test.sql` against the disposable schema using JWT-authenticated test actors. Do not use a privileged service client to claim RLS has been tested.
5. Run `npm test`, `npm run lint`, `npm run build`, the API integration suite, and approved E2E journeys against the staging URL.
6. Verify anonymous denial, patient ownership, tenant/department separation, role revocation, suspended-tenant denial, legacy admin compatibility, doctor application approval/rejection/suspension, credential document owner/reviewer denial and access, and audit records with realistic authenticated sessions.
7. Test backup and restore, monitoring/alerts, request limits, log redaction, security headers, incident response, and session expiration.
8. Record findings and obtain independent security, clinical, privacy/legal, and operations approval.
9. Keep production credentials and data untouched until explicit release authorization. No automatic production deployment or migration is part of this guide.

## Rollback and recovery

No tenant migration has been applied by this work. Before any non-disposable application, establish a verified backup, review migration compatibility with the actual schema, rehearse recovery on an isolated copy, and document a tested forward-fix/restore plan. Do not delete user/profile/clinical records or roll back by destructive SQL.

## Monitoring and operations still required

- Central error monitoring and structured/redacted logs.
- Database and app health checks and alerting.
- Rate limiting and abuse protection.
- Access reviews, secret rotation, least-privilege operator controls.
- Verified backup retention and restore exercise.
- Incident response, privacy breach response, support, and data-subject workflows.
- Domain/HTTPS, secure headers, Supabase Auth URL allowlists, and production email delivery checks.

This guide is not evidence that any staging or production infrastructure is configured or verified.
