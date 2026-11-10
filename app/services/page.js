import InfoPage from "../components/InfoPage";

export const metadata = {
  title: "Healthcare Services | TriageX",
  description: "Explore the patient intake, triage, clinician review, and analytics features available in TriageX.",
};

export default function ServicesPage() {
  return (
    <InfoPage
      eyebrow="TRIAGEX SERVICES"
      title="Connected tools for a clearer care journey."
      description="TriageX brings the working parts of its care workflow together — from structured symptom intake through clinician review."
      notice="TriageX is a decision-support demonstration. It is not a medical provider and does not diagnose, treat, or replace a clinician."
      sections={[
        {
          title: "Guided patient assessment",
          body: "Capture patient details, selected facility, available vital signs, and a symptom description in one structured intake.",
          items: ["Four-step assessment flow", "Supported health facility selection", "Clear assessment result and queue token"],
        },
        {
          title: "Multilingual symptom input",
          body: "Use typed symptoms or browser-supported speech recognition. When configured, the server-side translation route can translate supported languages into English.",
          items: ["English translation shown first when available", "Original spoken transcript retained", "Text entry remains available if voice is unsupported"],
        },
        {
          title: "Clinician review queue",
          body: "The clinician-facing queue organizes submitted assessments and supports review, urgency updates, and notes.",
          items: ["Filter and search submitted records", "Review urgency and contributing information", "Queue metrics and analytics"],
        },
      ]}
      action={{ text: "Ready to try the working intake flow?", label: "Start a triage assessment", href: "/intake" }}
    />
  );
}
