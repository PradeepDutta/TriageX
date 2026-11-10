import { redirect } from 'next/navigation';
import DoctorRegistrationClient from './DoctorRegistrationClient';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export const metadata = { title: 'Register as a Doctor | TriageX' };
export const dynamic = 'force-dynamic';

export default async function DoctorRegistrationPage() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (context.error) {
    return <main className="doctor-page"><section className="doctor-card"><h1>Unable to verify your account</h1><p>Please retry or contact the site administrator.</p></section></main>;
  }
  if (context.user) {
    const { data: existingApplication, error } = await context.supabase
      .from('doctor_applications')
      .select('user_id')
      .eq('user_id', context.user.id)
      .maybeSingle();
    if (!error && existingApplication) redirect('/doctor/application');
  }
  return <DoctorRegistrationClient authenticated={Boolean(context.user)} accountEmail={context.user?.email || ''} />;
}
