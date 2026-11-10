import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export const metadata = { title: 'Patient Triage Intake | TriageX' };
export const dynamic = 'force-dynamic';

export default async function IntakePage() {
  const context = await getAuthenticatedContext();
  if (!context.configured) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Secure intake is unavailable</h1>
          <p>Configure Supabase authentication before collecting patient-identifying details.</p>
          <Link className="account-submit" href="/login">Sign in</Link>
        </section>
      </main>
    );
  }
  if (!context.user) redirect('/login?next=/intake');
  if (context.error || !['patient', 'clinician', 'admin'].includes(context.role)) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Unable to verify intake access</h1>
          <p>Please retry or contact your system administrator.</p>
        </section>
      </main>
    );
  }

  const { default: IntakeClient } = await import('./IntakeClient');
  return <IntakeClient />;
}
