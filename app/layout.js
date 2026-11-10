import "./globals.css";

export const metadata = {
  title: "TriageX — Smart Triage. Better Care.",
  description:
    "TriageX helps people assess symptoms, prioritize care, and connect with the right healthcare service through a clinician-reviewed triage workflow.",
  keywords:
    "AI triage, healthcare AI, multilingual triage, patient assessment, clinical decision support, TriageX",
  icons: {
    icon: "/triagex-logo.png",
    shortcut: "/triagex-logo.png",
    apple: "/triagex-logo.png",
  },
  openGraph: {
    title: "TriageX — Smart Triage. Better Care.",
    description:
      "AI-assisted multilingual patient triage platform combining symptoms, vital signs, voice interaction, and explainable clinical decision support.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
