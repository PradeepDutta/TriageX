import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Navbar from "./Navbar";
import SiteFooter from "./SiteFooter";

export default function InfoPage({
  eyebrow,
  title,
  description,
  sections,
  notice,
  action,
}) {
  return (
    <>
      <Navbar />
      <main className="site-info-page">
        <header className="site-info-hero">
          <div className="site-container">
            <span className="site-kicker">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </header>
        <div className="site-container site-info-content">
          {notice && (
            <aside className="site-info-notice">
              <ShieldCheck size={20} />
              <p>{notice}</p>
            </aside>
          )}
          <div className="site-info-grid">
            {sections.map((section) => (
              <article className="site-info-card" key={section.title}>
                <span className="site-info-check"><Check size={16} /></span>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {section.items && (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </article>
            ))}
          </div>
          {action && (
            <div className="site-info-action">
              <p>{action.text}</p>
              {action.href && (
                <Link href={action.href} className="site-button site-button-primary">
                  {action.label} <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
