import InfoPage from "../components/InfoPage";

export const metadata = {
  title: "Contact | TriageX",
  description: "Contact and support information for the TriageX demonstration platform.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="CONTACT"
      title="The right support starts with the right care team."
      description="This TriageX project does not have a configured support mailbox or contact-submission service. We will not ask you to send personal health information through an unconnected form."
      notice="For urgent medical concerns, contact your local emergency service. For assessment or clinical guidance, speak directly with a healthcare professional at your care facility."
      sections={[
        {
          title: "Questions about a health concern?",
          body: "Please contact a qualified healthcare professional or your local care facility. TriageX is not an emergency service and cannot provide personal medical advice.",
        },
        {
          title: "Questions about an assessment?",
          body: "If you have submitted an assessment, use the queue token shown in your result when speaking with staff at the selected facility. Do not share sensitive information on a public channel.",
        },
        {
          title: "Platform support",
          body: "A public support contact has not been configured for this project. A support form or patient account should only be added when a secure, monitored service is available.",
        },
      ]}
    />
  );
}
