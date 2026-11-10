import { getAuthenticatedContext } from '@/lib/supabase/server';

export async function GET() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (!context.configured) {
    return Response.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
  if (context.error) {
    return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  }
  if (!context.user) {
    return Response.json({ error: 'Sign in is required.' }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from('hospitals')
    .select('id, name, departments(id, name)')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('Unable to load authorized triage hospitals:', {
      code: error.code || null,
      status: error.status || null,
      message: error.message || 'No error message was provided.',
    });
    return Response.json({ error: 'Unable to load available hospital assignments.' }, { status: 503 });
  }

  const hospitals = [];
  for (const hospital of data || []) {
    const departments = [];
    for (const department of hospital.departments || []) {
      const [accessResult, createResult] = await Promise.all([
        context.supabase.rpc('can_access_triage_assessment', {
          target_hospital_id: hospital.id,
          target_department_id: department.id,
        }),
        context.supabase.rpc('can_create_triage_assessment', {
          target_hospital_id: hospital.id,
          target_department_id: department.id,
        }),
      ]);
      if (accessResult.error || createResult.error) {
        const authorizationError = accessResult.error || createResult.error;
        console.error('Unable to verify assessment creation access:', {
          code: authorizationError.code || null,
          status: authorizationError.status || null,
          message: authorizationError.message || 'No error message was provided.',
        });
        return Response.json({ error: 'Unable to verify hospital assignment permissions.' }, { status: 503 });
      }
      departments.push({
        ...department,
        canAccess: accessResult.data === true,
        canCreate: createResult.data === true,
      });
    }
    hospitals.push({ ...hospital, departments });
  }

  return Response.json({
    success: true,
    data: hospitals.map((hospital) => ({
      id: hospital.id,
      name: hospital.name,
      departments: hospital.departments || [],
    })),
  });
}
