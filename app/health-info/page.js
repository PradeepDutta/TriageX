import InfoPage from "../components/InfoPage";

export const metadata = {
  title: "Health Information | TriageX",
  description: "Important safety information about using TriageX and seeking professional care.",
};

export default function HealthInfoPage() {
  return (
    <InfoPage
      eyebrow="HEALTH INFORMATION"
      title="Helpful information, with your safety first."
      description="TriageX can help organize symptoms and available vital signs for review. It cannot determine a diagnosis or guarantee that a condition is safe to wait."
      notice="If you may be experiencing a medical emergency, do not wait for an online assessment. Contact your local emergency service or go to the nearest emergency department."
      sections={[
        {
          title: "Use an assessment as a starting point",
          body: "A triage result is decision support based on the information entered. Incomplete or changing symptoms can affect the result.",
          items: ["Share accurate information", "Include available vital signs", "Tell a healthcare professional if symptoms change"],
        },
        {
          title: "Get professional medical advice",
          body: "Only a qualified healthcare professional who can assess your situation can provide advice specific to your health.",
          items: ["Follow guidance from your care team", "Ask a clinician about uncertain results", "Do not use TriageX to delay urgent care"],
        },
        {
          title: "Understand multilingual input",
          body: "Speech recognition depends on browser and language support. Automated translation may not capture every nuance, so the original spoken transcript is kept for clinical context.",
          items: ["Review translated text when possible", "Correct text that does not match what you said", "Use typed input if voice recognition is unavailable"],
        },
      ]}
      action={{ text: "TriageX supports, but never replaces, professional clinical judgment.", label: "Start an assessment", href: "/intake" }}
    />
  );
}
