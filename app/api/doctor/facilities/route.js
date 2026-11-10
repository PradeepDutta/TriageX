import { getAuthenticatedContext } from '@/lib/supabase/server';

export async function GET() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (!context.configured) {
    return Response.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
  if (context.error) {
    return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  }
  const { data, error } = await context.supabase.rpc('list_active_doctor_facilities');
  if (error) {
    console.error('Unable to load doctor application facilities:', { code: error.code || null });
    return Response.json({ error: 'Unable to load available hospital affiliations.' }, { status: 503 });
  }

  const facilities = new Map();
  for (const row of data || []) {
    if (!facilities.has(row.hospital_id)) {
      facilities.set(row.hospital_id, {
        id: row.hospital_id,
        name: row.hospital_name,
        organizationName: row.organization_name,
        departments: [],
      });
    }
    facilities.get(row.hospital_id).departments.push({
      id: row.department_id,
      name: row.department_name,
    });
  }
  return Response.json({ success: true, data: [...facilities.values()] });
}
