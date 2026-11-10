import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOSPITAL_ROLES,
  ORGANIZATION_ROLES,
  PLATFORM_ROLES,
  validateTenantRoleRequest,
} from '../lib/supabase/tenant-authorization.js';
import { authorizeRoleContext } from '../lib/supabase/role-authorization.js';

const HOSPITAL_ID = '123e4567-e89b-42d3-a456-426614174000';
const DEPARTMENT_ID = '123e4567-e89b-42d3-a456-426614174001';

test('enterprise role scopes remain distinct from legacy profile roles', () => {
  assert.deepEqual(ORGANIZATION_ROLES, ['organization_admin']);
  assert.deepEqual(PLATFORM_ROLES, ['platform_super_admin']);
  assert.ok(HOSPITAL_ROLES.includes('hospital_admin'));
  assert.ok(HOSPITAL_ROLES.includes('department_manager'));
  assert.ok(HOSPITAL_ROLES.includes('doctor'));
  assert.ok(HOSPITAL_ROLES.includes('nurse'));
  assert.ok(HOSPITAL_ROLES.includes('triage_staff'));
  assert.ok(HOSPITAL_ROLES.includes('receptionist'));
  for (const legacyRole of ['admin', 'clinician', 'patient']) {
    assert.equal(HOSPITAL_ROLES.includes(legacyRole), false);
    assert.equal(ORGANIZATION_ROLES.includes(legacyRole), false);
    assert.equal(PLATFORM_ROLES.includes(legacyRole), false);
  }
});

test('validates organization and hospital role checks and their resource scope', () => {
  assert.deepEqual(
    validateTenantRoleRequest('organization', HOSPITAL_ID, ['organization_admin']),
    { valid: true },
  );
  assert.deepEqual(
    validateTenantRoleRequest('hospital', HOSPITAL_ID, ['doctor'], DEPARTMENT_ID),
    { valid: true },
  );
});

test('rejects invalid tenant IDs, unsupported roles, and invalid department scope', () => {
  assert.equal(validateTenantRoleRequest('hospital', 'not-a-uuid', ['doctor']).valid, false);
  assert.equal(validateTenantRoleRequest('organization', HOSPITAL_ID, ['admin']).valid, false);
  assert.equal(validateTenantRoleRequest('hospital', HOSPITAL_ID, ['platform_super_admin']).valid, false);
  assert.equal(validateTenantRoleRequest('hospital', HOSPITAL_ID, ['doctor'], 'invalid').valid, false);
  assert.equal(validateTenantRoleRequest('organization', HOSPITAL_ID, ['organization_admin'], DEPARTMENT_ID).valid, false);
});

test('legacy API authorization rejects anonymous and unrelated accounts', async () => {
  const anonymous = authorizeRoleContext({ configured: true, user: null }, ['clinician', 'admin']);
  assert.equal(anonymous.status, 401);

  const patient = authorizeRoleContext(
    { configured: true, user: { id: 'patient-id' }, role: 'patient' },
    ['clinician', 'admin'],
  );
  assert.equal(patient.status, 403);

  const misconfigured = authorizeRoleContext({ configured: false }, ['clinician', 'admin']);
  assert.equal(misconfigured.status, 503);
});

test('legacy admin access remains explicit and does not create tenant grants', () => {
  const legacyAdmin = authorizeRoleContext(
    { configured: true, user: { id: 'legacy-admin-id' }, role: 'admin' },
    ['clinician', 'admin'],
  );
  assert.equal(legacyAdmin, null);
  assert.equal(PLATFORM_ROLES.includes('admin'), false);
  assert.equal(HOSPITAL_ROLES.includes('admin'), false);
  assert.equal(ORGANIZATION_ROLES.includes('admin'), false);
});
