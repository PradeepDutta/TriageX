import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';
import { authorizeRoleContext } from './role-authorization';
import { validateTenantRoleRequest } from './tenant-authorization';

const REMEMBER_COOKIE = 'triagex-remember';
const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

export function logSupabaseAuthError(operation, error) {
  console.error(`Supabase ${operation} failed:`, {
    name: error?.name || 'UnknownError',
    code: error?.code || null,
    status: error?.status || null,
    message: error?.message || 'No error message was provided.',
  });
}

export async function createSupabaseServerClient({ remember = null } = {}) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  const shouldRemember = remember ?? cookieStore.has(REMEMBER_COOKIE);
  const secure = process.env.NODE_ENV === 'production';

  return createServerClient(config.url, config.key, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure,
      httpOnly: true,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure,
            httpOnly: true,
            ...(shouldRemember ? { maxAge: REMEMBER_MAX_AGE } : { maxAge: undefined }),
          });
        }
      },
    },
  });
}

export async function getAuthenticatedContext({ includeLegacyRole = true } = {}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { configured: false, supabase: null, user: null, role: null };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError?.name === 'AuthSessionMissingError') {
    return { configured: true, supabase, user: null, role: null };
  }
  if (userError) {
    console.error('Unable to verify the current Supabase user:', userError.message);
    return { configured: true, supabase, user: null, role: null, error: userError };
  }
  if (!user) return { configured: true, supabase, user: null, role: null };
  if (!includeLegacyRole) return { configured: true, supabase, user, role: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Unable to load the authenticated account role:', profileError.message);
    return { configured: true, supabase, user, role: null, error: profileError };
  }

  return { configured: true, supabase, user, role: profile?.role || null };
}

export async function requireRole(allowedRoles) {
  const context = await getAuthenticatedContext();
  return { ...context, response: authorizeRoleContext(context, allowedRoles) };
}

async function requireTenantRpc(rpcName, args, currentContext = null) {
  const context = currentContext || await getAuthenticatedContext({ includeLegacyRole: false });
  if (!context.configured) {
    return { ...context, response: Response.json({ error: 'Authentication is not configured.' }, { status: 503 }) };
  }
  if (context.error) {
    return { ...context, response: Response.json({ error: 'Unable to verify account access.' }, { status: 503 }) };
  }
  if (!context.user) {
    return { ...context, response: Response.json({ error: 'Sign in is required.' }, { status: 401 }) };
  }

  const { data, error } = await context.supabase.rpc(rpcName, args);
  if (error) {
    console.error(`Tenant authorization check "${rpcName}" failed:`, {
      code: error.code || null,
      status: error.status || null,
      message: error.message || 'No error message was provided.',
    });
    return { ...context, response: Response.json({ error: 'Unable to verify tenant access.' }, { status: 503 }) };
  }
  if (data !== true) {
    return { ...context, response: Response.json({ error: 'This account does not have permission for this tenant.' }, { status: 403 }) };
  }
  return { ...context, response: null };
}

export async function requirePlatformSuperAdmin() {
  return requireTenantRpc('is_platform_super_admin', {});
}

export async function requireDoctorApplicationReviewer(currentContext = null) {
  return requireTenantRpc('can_review_any_doctor_applications', {}, currentContext);
}

export async function requireOrganizationRole(organizationId, roles = ['organization_admin']) {
  const validation = validateTenantRoleRequest('organization', organizationId, roles);
  if (!validation.valid) {
    return { response: Response.json({ error: validation.error }, { status: 400 }) };
  }
  return requireTenantRpc('has_organization_role', {
    target_organization_id: organizationId,
    allowed_roles: roles,
  });
}

export async function requireHospitalRole(hospitalId, roles, departmentId = null) {
  const validation = validateTenantRoleRequest('hospital', hospitalId, roles, departmentId);
  if (!validation.valid) {
    return { response: Response.json({ error: validation.error }, { status: 400 }) };
  }
  return requireTenantRpc('has_hospital_role', {
    target_hospital_id: hospitalId,
    allowed_roles: roles,
    target_department_id: departmentId,
  });
}

export async function requireTriageAssessmentAccess(
  hospitalId,
  departmentId,
  { create = false, context = null } = {}
) {
  const validation = validateTenantRoleRequest('hospital', hospitalId, ['doctor'], departmentId);
  if (!validation.valid || !departmentId) {
    return {
      response: Response.json(
        { error: validation.error || 'A department assignment is required.' },
        { status: 400 }
      ),
    };
  }
  return requireTenantRpc(
    create ? 'can_create_triage_assessment' : 'can_access_triage_assessment',
    {
      target_hospital_id: hospitalId,
      target_department_id: departmentId,
    },
    context
  );
}
