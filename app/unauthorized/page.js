import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Access restricted | TriageX' };

export default function UnauthorizedPage() {
  return (
    <main className="account-page">
      <section className="account-card">
        <span className="account-security-icon"><ShieldCheck size={26} /></span>
        <h1>Access restricted</h1>
        <p>This area is available only to accounts with an authorized clinical role. Roles are assigned by a system administrator.</p>
        <Link className="account-submit" href="/">Return to TriageX <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
