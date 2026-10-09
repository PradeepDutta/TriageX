import "./globals.css";

export const metadata = {
  title: "TriageX — AI-Assisted Multilingual Patient Triage",
  description:
    "TriageX combines patient symptoms, vital signs, multilingual voice interaction, and explainable AI-assisted assessment to help healthcare teams prioritize patients efficiently.",
  keywords:
    "AI triage, healthcare AI, multilingual triage, patient assessment, clinical decision support, TriageX",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "TriageX — Smarter Triage. Faster Decisions. Better Care.",
    description:
      "AI-assisted multilingual patient triage platform combining symptoms, vital signs, voice interaction, and explainable clinical decision support.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
