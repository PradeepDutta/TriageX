import InfoPage from "../components/InfoPage";

export const metadata = {
  title: "About TriageX | Smart Triage. Better Care.",
  description: "Learn about TriageX's human-centered approach to structured triage and clinical review.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="ABOUT TRIAGEX"
      title="Smart Triage. Better Care."
      description="TriageX is built around a simple idea: clear, structured information can help people communicate concerns and help healthcare teams organize the next step."
      notice="TriageX provides configured rule-based, AI-assisted decision support. A qualified clinician remains responsible for clinical review and decisions."
      sections={[
        {
          title: "Built for clearer communication",
          body: "The intake brings patient-reported symptoms, available vital signs, and language context into a single assessment record.",
          items: ["Patient-first information gathering", "Multilingual voice and text pathways", "English translation with original transcript preserved"],
        },
        {
          title: "Designed for human review",
          body: "TriageX surfaces an urgency recommendation and its contributing information for a clinician to review, modify, and document.",
          items: ["Explainable triage results", "Clinician queue and review workflow", "No autonomous treatment decisions"],
        },
        {
          title: "A transparent demonstration",
          body: "The current project provides working patient intake, triage rules, queue management, review, and analytics. It does not provide patient authentication or a production clinical record system.",
          items: ["No patient login is configured", "No real-time vital monitoring", "Sample homepage metrics are clearly labeled"],
        },
      ]}
      action={{ text: "Explore the current, connected triage workflow.", label: "See TriageX services", href: "/services" }}
    />
  );
}
