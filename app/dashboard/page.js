import { redirect } from 'next/navigation';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export const metadata = { title: 'Clinician Queue | TriageX' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const context = await getAuthenticatedContext();
  if (!context.configured) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Clinical access is unavailable</h1>
          <p>Configure Supabase accounts and assign a clinician role to access the clinical queue.</p>
        </section>
      </main>
    );
  }
  if (!context.user) redirect('/login?next=/dashboard');
  if (context.error) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Unable to verify clinical access</h1>
          <p>Please retry or contact your system administrator.</p>
        </section>
      </main>
    );
  }
  if (!['clinician', 'admin'].includes(context.role)) redirect('/unauthorized');

  const { default: DashboardClient } = await import('./DashboardClient');
  return <DashboardClient />;
}
