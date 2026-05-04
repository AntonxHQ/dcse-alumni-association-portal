import Link from 'next/link';

import { AuthShell } from '../../../../components/auth/auth-shell';
import { ForgotPasswordForm } from './forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email to receive a reset link"
    >
      <ForgotPasswordForm />
      <p className="mt-4 text-sm text-foreground-light">
        Remembered your password?{' '}
        <Link className="text-brand transition-colors hover:text-brand-600" href="/auth/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
