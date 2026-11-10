import { redirect } from 'next/navigation';
import DoctorApplicationsClient from './DoctorApplicationsClient';
import { getAuthenticatedContext, requireDoctorApplicationReviewer } from '@/lib/supabase/server';

export const metadata = { title: 'Doctor application review | TriageX' };
export const dynamic = 'force-dynamic';

export default async function DoctorApplicationsPage() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (context.error) {
    return <main className="doctor-admin-page"><h1>Unable to verify reviewer access</h1><p>Please sign in again and retry.</p></main>;
  }
  if (!context.user) redirect('/login?next=%2Fadmin%2Fdoctor-applications');
  const access = await requireDoctorApplicationReviewer(context);
  if (access.response?.status === 403) redirect('/unauthorized');
  if (access.response) {
    return <main className="doctor-admin-page"><h1>Doctor review is unavailable</h1><p>Unable to verify reviewer permissions. Please retry.</p></main>;
  }
  return <DoctorApplicationsClient />;
}
