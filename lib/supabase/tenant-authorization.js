export const ORGANIZATION_ROLES = Object.freeze(['organization_admin']);

export const HOSPITAL_ROLES = Object.freeze([
  'hospital_admin',
  'department_manager',
  'doctor',
  'nurse',
  'triage_staff',
  'receptionist',
]);

export const PLATFORM_ROLES = Object.freeze(['platform_super_admin']);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateTenantRoleRequest(scope, resourceId, roles, departmentId = null) {
  if (!UUID_PATTERN.test(resourceId || '')) {
    return { valid: false, error: 'A valid tenant resource ID is required.' };
  }

  const allowedRoles = scope === 'organization'
    ? ORGANIZATION_ROLES
    : scope === 'hospital'
      ? HOSPITAL_ROLES
      : null;

  if (!allowedRoles) {
    return { valid: false, error: 'A supported tenant scope is required.' };
  }
  if (
    !Array.isArray(roles) ||
    roles.length === 0 ||
    roles.some((role) => !allowedRoles.includes(role))
  ) {
    return { valid: false, error: `One or more ${scope} roles are not supported.` };
  }
  if (departmentId !== null && !UUID_PATTERN.test(departmentId)) {
    return { valid: false, error: 'A valid department ID is required.' };
  }
  if (scope === 'organization' && departmentId !== null) {
    return { valid: false, error: 'Organization roles cannot be scoped to a department.' };
  }

  return { valid: true };
}
