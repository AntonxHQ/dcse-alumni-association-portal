import Link from 'next/link';

import { AuthShell } from '../../../../components/auth/auth-shell';
import { loginWithPasswordAction } from './actions';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  value: string | string[] | undefined,
  fallback = '',
): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchRecord = (await props.searchParams) ?? {};
  const error = getParam(searchRecord.error);
  const next = getParam(searchRecord.next, '/dashboard');
  const email = getParam(searchRecord.email);

  return (
    <AuthShell title="Sign in" subtitle="Access your alumni dashboard">
      {error ? <p className="mb-3 text-xs text-destructive">{error}</p> : null}
      <form action={loginWithPasswordAction} className="space-y-4">
        <input name="next" type="hidden" value={next} />
        <label className="block text-sm font-medium text-foreground-light">
          <span className="mb-1.5 block">Email</span>
          <input defaultValue={email} name="email" required type="email" />
        </label>
        <label className="block text-sm font-medium text-foreground-light">
          <span className="mb-1.5 block">Password</span>
          <input name="password" required type="password" />
        </label>
        <button
          className="w-full rounded-full bg-brand py-2 text-sm font-medium text-foreground-contrast transition-colors duration-150 hover:bg-brand-600"
          type="submit"
        >
          Sign in
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="text-brand transition-colors hover:text-brand-600" href="/auth/forgot-password">
          Forgot password?
        </Link>
        <Link className="text-brand transition-colors hover:text-brand-600" href="/auth/register">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
