import AuthForm from '../components/AuthForm';

export const metadata = { title: 'Choose a new password | TriageX' };

export default function ResetPasswordPage() {
  return <AuthForm mode="reset" />;
}
