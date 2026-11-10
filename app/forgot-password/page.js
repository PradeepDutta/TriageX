import AuthForm from '../components/AuthForm';

export const metadata = { title: 'Password recovery | TriageX' };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
