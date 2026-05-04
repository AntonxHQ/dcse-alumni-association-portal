import Link from 'next/link';

import { AuthShell } from '../../../../components/auth/auth-shell';
import { ResetPasswordForm } from './reset-password-form';

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default async function ResetPasswordPage(props: ResetPasswordPageProps) {
  const searchRecord = (await props.searchParams) ?? {};
  const tokenHash = getParam(searchRecord.token_hash);
  const type = getParam(searchRecord.type);

  if (!tokenHash || !type) {
    return (
      <AuthShell title="Reset password" subtitle="Use a valid reset link from email">
        <p className="text-xs text-destructive">
          Missing reset token. Please request a new password reset email.
        </p>
        <p className="mt-3 text-sm text-foreground-light">
          <Link
            className="text-brand transition-colors hover:text-brand-600"
            href="/auth/forgot-password"
          >
            Request a new reset link
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset password" subtitle="Set your new password below">
      <ResetPasswordForm tokenHash={tokenHash} type={type} />
    </AuthShell>
  );
}
