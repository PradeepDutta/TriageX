import { redirect } from 'next/navigation';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export const metadata = { title: 'Clinical Analytics | TriageX' };
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const context = await getAuthenticatedContext();
  if (!context.configured) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Clinical analytics are unavailable</h1>
          <p>Configure Supabase accounts and assign a clinician role to access clinical analytics.</p>
        </section>
      </main>
    );
  }
  if (!context.user) redirect('/login?next=/analytics');
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

  const { default: AnalyticsClient } = await import('./AnalyticsClient');
  return <AnalyticsClient />;
}
