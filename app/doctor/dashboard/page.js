import { redirect } from 'next/navigation';
import { getAuthenticatedContext, requireHospitalRole } from '@/lib/supabase/server';

export const metadata = { title: 'Doctor dashboard | TriageX' };
export const dynamic = 'force-dynamic';

export default async function DoctorDashboardPage() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (context.error) {
    return <main className="account-page"><section className="account-card"><h1>Unable to verify clinical access</h1><p>Please retry or contact your administrator.</p></section></main>;
  }
  if (!context.user) redirect('/login?next=%2Fdoctor%2Fdashboard');

  const { data: application, error } = await context.supabase
    .from('doctor_applications')
    .select('status, requested_hospital_id, assigned_department_id')
    .eq('user_id', context.user.id)
    .maybeSingle();
  if (error) {
    console.error('Unable to verify doctor dashboard application:', { code: error.code || null });
    return <main className="account-page"><section className="account-card"><h1>Doctor access is unavailable</h1><p>Please retry later.</p></section></main>;
  }
  if (!application || application.status !== 'approved' || !application.assigned_department_id) {
    redirect('/doctor/application');
  }

  const access = await requireHospitalRole(
    application.requested_hospital_id,
    ['doctor'],
    application.assigned_department_id
  );
  if (access.response?.status === 403) redirect('/doctor/application');
  if (access.response) {
    return <main className="account-page"><section className="account-card"><h1>Unable to verify doctor permissions</h1><p>Please retry or contact your hospital administrator.</p></section></main>;
  }

  const { default: DashboardClient } = await import('@/app/dashboard/DashboardClient');
  return <DashboardClient />;
}
