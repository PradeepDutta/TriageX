import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BadgeCheck, Clock3, FileCheck2, ShieldAlert, Stethoscope } from 'lucide-react';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export const metadata = { title: 'Doctor application status | TriageX' };
export const dynamic = 'force-dynamic';

const STATUS_COPY = {
  pending: {
    title: 'Application under review',
    description: 'Your application is pending review by an authorized hospital administrator. Clinical permissions remain disabled until a decision is recorded.',
    icon: Clock3,
  },
  approved: {
    title: 'Doctor account approved',
    description: 'Your hospital-scoped doctor access has been assigned. Continue to your authorized clinical dashboard.',
    icon: BadgeCheck,
  },
  rejected: {
    title: 'Application not approved',
    description: 'The reviewer recorded the reason below. Your account has no doctor privileges.',
    icon: ShieldAlert,
  },
  suspended: {
    title: 'Doctor access suspended',
    description: 'Doctor privileges have been revoked. Contact the hospital administrator for more information.',
    icon: ShieldAlert,
  },
};

export default async function DoctorApplicationPage() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (!context.configured) {
    return <main className="doctor-page"><section className="doctor-card"><h1>Account access is not configured</h1></section></main>;
  }
  if (context.error) {
    return <main className="doctor-page"><section className="doctor-card"><h1>Unable to verify your account</h1><p>Please retry.</p></section></main>;
  }
  if (!context.user) redirect('/login?next=%2Fdoctor%2Fapplication');

  const { data: application, error } = await context.supabase
    .from('doctor_applications')
    .select('status, decision_note, submitted_at, reviewed_at')
    .eq('user_id', context.user.id)
    .maybeSingle();

  if (error) {
    console.error('Unable to load current doctor application status:', { code: error.code || null });
    return <main className="doctor-page"><section className="doctor-card"><h1>Application status unavailable</h1><p>Please try again later.</p></section></main>;
  }
  if (!application) {
    return (
      <main className="doctor-page">
        <section className="doctor-card">
          <div className="doctor-heading"><span className="account-eyebrow"><Stethoscope size={15} /> DOCTOR ONBOARDING</span><h1>No application submitted</h1><p>Your signed-in account does not yet have a doctor application.</p></div>
          <Link className="account-submit doctor-link-button" href="/register/doctor">Continue doctor registration</Link>
        </section>
      </main>
    );
  }

  const state = STATUS_COPY[application.status];
  const Icon = state?.icon || FileCheck2;
  return (
    <main className="doctor-page">
      <section className="doctor-card doctor-status-card">
        <div className={`doctor-status-icon doctor-status-${application.status}`}><Icon size={28} /></div>
        <span className="account-eyebrow">DOCTOR APPLICATION · {application.status.toUpperCase()}</span>
        <h1>{state?.title || 'Application status'}</h1>
        <p>{state?.description}</p>
        <dl className="doctor-status-details">
          <div><dt>Submitted</dt><dd>{new Date(application.submitted_at).toLocaleString()}</dd></div>
          {application.reviewed_at && <div><dt>Reviewed</dt><dd>{new Date(application.reviewed_at).toLocaleString()}</dd></div>}
        </dl>
        {application.decision_note && <div className="doctor-review-note"><strong>Reviewer note</strong><p>{application.decision_note}</p></div>}
        {application.status === 'approved' && <Link className="account-submit doctor-link-button" href="/doctor/dashboard">Open doctor dashboard</Link>}
        {application.status === 'pending' && <p className="doctor-help">You can return to this page to check for a decision. No credential validation is automated.</p>}
        {(application.status === 'rejected' || application.status === 'suspended') && <Link className="doctor-secondary-link" href="/contact">Contact TriageX support</Link>}
        <Link className="doctor-secondary-link" href="/">Return home</Link>
      </section>
    </main>
  );
}
