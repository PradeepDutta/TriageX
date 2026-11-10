# TriageX system architecture proposal

**Status:** Phase 1 architecture proposal updated for the local Phase 2 tenant-scoped assessment implementation. Tenant migrations remain unapplied and no live database change has been made.

## Current architecture

```text
Browser (Next.js App Router / React)
  ├─ Public pages and sample-only patient dashboard
  ├─ Auth/settings/intake/dashboard/analytics clients
  └─ Same-origin Route Handlers
       ├─ Supabase Auth + cookie-backed SSR session
       ├─ Postgres: profiles, user_preferences, privacy_requests
       ├─ Postgres: owner/tenant-scoped triage assessments (new, unapplied schema)
       └─ Optional Google Cloud Translation v2 request (server-side)

proxy.js refreshes Supabase cookies; route/page code performs identity and
explicit tenant authorization checks. New tenant RPCs and assessment RLS policies
are defined in unapplied migrations. The clinical API routes use these Supabase
paths locally, but no database authorization behavior has been verified.
```

The Supabase publishable key is used by the server-side Supabase SSR client and is also `NEXT_PUBLIC_*`; it is designed to be public when protected by RLS. No service-role key was configured in the inspected environment. Keep privileged database credentials out of browser bundles and out of shared environment files.

## Target architecture (incremental)

```text
Browser
  │ session cookie (Supabase Auth)
  ▼
Next.js presentation + Route Handlers
  ├─ Zod-equivalent/server validation (retain JavaScript if appropriate)
  ├─ Verified user identity and explicit permission checks
  ├─ Resolved active organization/hospital membership
  ├─ Tenant-scoped queries (hospital_id and actor context)
  └─ Server-only external adapters, each explicitly configured
       ▼
Supabase Auth ── public.profiles (legacy identity bridge)
Postgres
  ├─ organizations → hospitals → departments
  ├─ memberships and explicit platform-level grants
  ├─ patients / appointments / clinical triage records
  ├─ operations tables added only for approved workflows
  └─ append-only security/audit events
      └─ RLS enforced using user identity + active membership + permission
```

### Decisions recommended for review

1. Keep the existing Next.js App Router, JavaScript codebase, Supabase Auth, Postgres, and visual design. Do not migrate frameworks or convert the entire project to TypeScript as part of tenant work.
2. Keep `auth.users` as the identity source. Treat current `profiles.role` as a legacy compatibility field during migration; do not infer a new global super-admin assignment from an existing `admin` role.
3. Use hospital-scoped memberships for hospital/department roles. A user may have multiple memberships, but every request must resolve the resource's hospital and verify that membership's state and permission.
4. Represent platform privileges separately and grant them explicitly after independent identity/authorization review. Existing administrators retain current `admin` access under a documented compatibility mapping until a reviewed cutover; do not auto-promote them to `platform_super_admin`.
5. Apply authorization twice: server route checks for clear UX/defense in depth and Postgres RLS for data enforcement. Do not rely on `proxy.js` as the only control or on client-supplied role, user, organization, or hospital IDs.
6. Clinical API routes now use an additive tenant-scoped Postgres assessment schema rather than module-level memory. Verify migrations, RLS, and authenticated cross-tenant tests in disposable Supabase before enabling hospital workflows; keep simulation/demo fixtures isolated from operational data.
7. Prefer narrowly scoped SQL RPCs or server-side queries for audited state transitions. Never expose a service-role key to client code or use it to bypass tenant RLS for normal user requests.
8. Treat translation and future FHIR/ABDM, messaging, payments, lab, and pharmacy connections as optional server-side adapters. An adapter is not an integration until credentials, consent, error handling, security review, and end-to-end verification are complete.

## Request authorization flow proposal

1. Validate the Supabase session using the server client.
2. Load or resolve the authenticated user's active membership/explicit platform grant from the database, not the request body.
3. Resolve resource scope from a trusted resource row or validated route parameter; compare it to membership scope.
4. Execute the operation with RLS still enabled; database policies independently enforce the same tenant boundary.
5. Record a minimal audit event for sensitive actions with actor, action, resource ID/type, hospital/organization, timestamp, and outcome. Keep clinical payloads and secrets out of logs.
6. Return only fields required by the caller; avoid platform-wide clinical data visibility by default.

### Phase 2 implementation boundary

The unapplied tenant migrations add explicit organization, hospital, and platform grants, assessment persistence, RLS, and authorization RPCs. `lib/supabase/server.js` has server-side helpers for explicit tenant-role checks. Clinical routes use these helpers and RLS-backed Supabase reads/writes without relying on or changing legacy `profiles.role`. Authenticated tenant-grant writes are not provided. Since the migrations and database policies are unverified, do not treat the local implementation as enabling production multi-hospital workflows.

## Operational architecture still needed

- Production Supabase environment separation, secrets management, redirect and email configuration, database migration discipline, and access review.
- Durable clinical storage, backup/restore procedures, retention rules, incident response, monitoring, rate limits, and audit review.
- Secure private storage flow and authorization if document uploads are approved.
- Deployment topology, scaling expectations, connection/pool strategy, and consistency guarantees. The old module store remains test-only; clinical route persistence still requires database verification.
- Independent legal, privacy, security, and clinical governance review before any protected health data or care decisions are handled.

## Not included in the Phase 2 foundation

No live database writes or migration application, role remapping, clinical API migration, external integration, dashboard, or production configuration changes have been made. Continue only after the architecture and data ownership decisions are reviewed and the migration is tested in a disposable Supabase project.