# TriageX database design proposal

**Status:** Phase 1 proposal plus unapplied Phase 2 tenant and assessment migrations. No live database change has been made. This is not a production-ready tenant workflow.

## Current checked-in schema

The existing migrations define:

- `public.profiles`: one row per `auth.users.id`, display name, legacy role constrained to `patient`, `clinician`, or `admin`.
- `public.user_preferences`: one row per auth user; theme, language, notification flags, accessibility, and speech language.
- `public.privacy_requests`: account deletion requests with account-scoped reads/inserts.

RLS is enabled for these tables. The migration grants authenticated users only the access needed by its self-read and self-preference/request policies. The Auth trigger is security-definer, uses a fixed empty search path, and assigns new users `patient`. The repair migration adds the expected auth FK only if missing and uses `ON CONFLICT DO NOTHING` when creating a profile; it will not overwrite an existing role. Whether either migration has been applied remotely is unverified.

The Phase 1 audit found no tenant schema. An additive foundation migration defines the organization/hospital/department hierarchy, explicit membership and role grants, tenant access RLS, and tenant authorization RPCs. A second additive migration defines `public.triage_assessments` with patient ownership or explicit hospital/department scope, RLS policies, restricted update permissions, and database-derived review attribution. Both tenant migrations remain unapplied; the legacy in-memory store is retained only for unit tests and is not a clinical API data source.

## Phase 2 migration foundation (not applied)

`supabase/migrations/20261110000200_multitenancy_foundation.sql` adds:

- Organization, hospital, department, organization membership, hospital membership, hospital role grant, and platform role grant tables.
- Separate role scopes: `organization_admin`; hospital-scoped `hospital_admin`, `department_manager`, `doctor`, `nurse`, `triage_staff`, and `receptionist`; and explicitly granted `platform_super_admin`.
- Active-membership, tenant-status, and department-scope checks in the authorization RPCs. Hospital access requires an active organization/hospital and an active role grant (or an active organization administrator); department rows require a hospital-wide role or a grant for that active department.
- RLS-enabled, read-only authenticated access policies for tenant metadata and access grants. No tenant-table write grants or user-facing grant-management workflow are provided in this phase.
- Database audit triggers for tenant and grant mutations. Audit tenant IDs intentionally have no tenant foreign keys so an eventual tenant deletion cannot erase history or make the audit trigger fail.

The migration does not update `profiles`, `auth.users`, existing role values, or any clinical data. In particular, legacy `admin` does not imply a platform or hospital role. It uses `CREATE TABLE IF NOT EXISTS`, which is not a substitute for checking the actual remote schema before application.

Before applying, inspect the target database and verify the SQL against a disposable Supabase project. Then test the RPCs and every RLS policy using JWT-authenticated users with no grant, active and revoked grants, suspended tenants, cross-hospital IDs, and legacy `admin` profiles. The current workspace has no database connection or Supabase CLI, so those checks have not been performed and the migration has not been applied.

## Phase 2 assessment persistence (not applied)

`supabase/migrations/20261110000300_tenant_scoped_triage_assessments.sql` adds the assessment table used by the local clinical API implementation. Private assessments are owned by `auth.uid()` and have no tenant IDs. Staff-created cases require explicit hospital and department IDs and have no implicit patient-account link. Policies distinguish owner access from current active tenant grants; update permissions restrict mutable columns, and a trigger stamps review attribution from the authenticated database identity.

The migration and its pgTAP assertions have not been run against PostgreSQL. Do not treat source definitions as proof of RLS behavior. Verify both tenant migrations, grants, trigger behavior, role revocation, suspension, owner isolation, and cross-hospital/department denial in a disposable Supabase project before using the feature or changing production.

## Proposed organization and authorization model

### Identity and tenants

- `profiles`: retain as the user-facing identity bridge to `auth.users`; gradually retire `role` for authorization after legacy migration is tested.
- `organizations`: hospital groups/operating organizations, status and administrative metadata.
- `hospitals`: organization-owned facilities, unique stable identifiers and lifecycle state.
- `departments`: hospital-owned departments; enforce uniqueness of normalized department key/name within hospital.
- `hospital_memberships`: `(user_id, hospital_id)` membership and one or more hospital-scoped roles/status. This supports one user at multiple hospitals.
- `department_memberships` (or department IDs on membership only if a user is constrained to one department): scoped unit membership, with validation that department and membership hospital agree.
- `platform_role_grants`: separately controlled platform privileges and grant/revocation metadata. Do not infer `platform_super_admin` from the old `admin` role.
- `staff_profiles`: employment/credential metadata linked to a membership or user, with access restricted to authorized administrators.
- `patients`: hospital-scoped patient identity/demographic records, with a nullable/unique link to an auth user only when the person has a patient portal account. Define a reviewed duplicate/identity strategy before import.
- `patient_representatives` (future, if approved): explicit, scoped, revocable patient-to-representative relation; never imply access solely through shared contact details.

### Clinical and operational records

Every hospital-owned record must have a non-null `hospital_id` (or reference a parent whose hospital ID is enforced consistently). Proposed tables:

- `appointments`
- `triage_cases`
- `triage_assessments`
- `triage_history`
- `clinician_assignments`
- `beds`
- `admissions`
- `referrals`
- `notifications`
- `audit_logs`
- `subscriptions` and plan/feature configuration, isolated from clinical record access

Use immutable identifiers; explicit timestamps and actor IDs; constrained lifecycle states; foreign keys; indexes on hospital plus common status/time lookups; uniqueness for local identifiers within a hospital; and transaction-backed transitions. A clinical assessment should preserve original inputs/decision context and human review/version lineage only after the clinical, privacy, and retention requirements are approved. Do not persist fabricated demonstration data into operational tables.

## Tenant and patient isolation policy principles

1. Turn RLS on for every tenant and clinical table before granting access to application roles.
2. Every read/write policy must bind the row's hospital to a current active membership and the required permission. Patient-facing policies additionally bind the patient row to the authenticated user or an explicit representative grant.
3. Scope parent-child relationships. Prefer composite uniqueness/foreign keys such as `(hospital_id, id)` and child references `(hospital_id, parent_id)` where needed to prevent accidentally linking a child row to a parent in another hospital.
4. Revoke broad table privileges first, then grant only required operations; RLS remains enabled. No broad policy such as `USING (true)` and no anonymous clinical access.
5. Keep role/membership mutation behind an audited administrative workflow; users cannot write their own membership, tenant ID, or role.
6. Avoid a `SECURITY DEFINER` authorization helper unless its owner, fixed `search_path`, execution grants, and tested semantics are explicitly reviewed.
7. Ensure stats, search, exports, and background operations use the same tenant filters. Aggregates can leak sensitive operational information and are not automatically public.
8. Keep audit history append-only to application roles, with database-side safeguards against user edits/deletes. Define retention and restricted audit-reader access.

## Safe migration strategy

1. Inventory the actual Supabase schema, constraints, triggers, policies, grants, existing `profiles.role` values, and account counts using read-only queries and authorized operator access.
2. Back up the project and test migrations on a non-production project copied with synthetic/de-identified data.
3. Add new tables/columns/indexes without dropping or rewriting existing tables. Keep legacy role checks working during the compatibility period.
4. Create organizations/hospitals and memberships only from verified operator-provided mappings. Do not create a default tenant and silently assign all existing users or clinical records to it.
5. For existing administrators, require an explicit reviewed mapping to a scoped role; never convert all `admin` users to platform super-admins.
6. Add RLS and deny-by-default grants before exposing new API routes. Test allowed and denied access using actual JWT-backed roles.
7. Backfill only with a reviewed mapping and retain source IDs/rollback artifacts. Reject ambiguous records rather than guessing their hospital.
8. Cut over one workflow at a time; compare reads and counts; keep a rollback path that does not destroy original users or records.

No live schema inspection, migration, or database mutation occurred during Phase 1. See the migration gates in [SECURITY_PLAN.md](./SECURITY_PLAN.md) and [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md).