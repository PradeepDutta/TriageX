import AuthForm from '../components/AuthForm';

export const metadata = { title: 'Create a patient account | TriageX' };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
