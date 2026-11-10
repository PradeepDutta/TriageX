import { redirect } from 'next/navigation';
import SettingsClient from '../components/SettingsClient';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export const metadata = { title: 'Account settings | TriageX' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const context = await getAuthenticatedContext();
  if (!context.configured) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Settings are unavailable</h1>
          <p>Connect Supabase to enable accounts and securely saved preferences.</p>
        </section>
      </main>
    );
  }
  if (!context.user) redirect('/login?next=/settings');
  if (context.error || !context.role) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Unable to verify your account</h1>
          <p>Please retry in a moment or contact your system administrator.</p>
        </section>
      </main>
    );
  }
  if (!['patient', 'clinician', 'admin'].includes(context.role)) redirect('/unauthorized');

  return <SettingsClient email={context.user.email || ''} role={context.role} />;
}
