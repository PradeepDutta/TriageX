import Link from "next/link";
import Image from "next/image";
import { Activity, ArrowUpRight, ShieldCheck } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Link href="/" className="site-footer-logo">
              <span><Image src="/triagex-logo.png" alt="" width={34} height={34} /></span>
              TriageX
            </Link>
            <p>Smart Triage. Better Care.</p>
            <small>Decision support designed to help people and care teams communicate more clearly.</small>
          </div>
          <nav className="site-footer-links" aria-label="Footer navigation">
            <div><strong>Explore</strong><Link href="/">Home</Link><Link href="/intake">Start Triage</Link><Link href="/services">Services</Link><Link href="/health-info">Health Info</Link></div>
            <div><strong>Platform</strong><Link href="/about">About TriageX</Link><Link href="/patient-dashboard">Patient dashboard preview</Link><Link href="/dashboard">Clinical Queue</Link><Link href="/analytics">Analytics</Link><Link href="/contact">Contact</Link></div>
          </nav>
          <Link href="/health-info" className="site-footer-safety">
            <ShieldCheck size={18} />
            <span><strong>Carefully designed support</strong><small>Not a replacement for professional medical judgment.</small></span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="site-footer-bottom">
          <span>© 2026 TriageX</span>
          <span><Activity size={14} /> Smart Triage. Better Care.</span>
        </div>
      </div>
    </footer>
  );
}
