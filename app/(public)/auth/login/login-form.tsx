'use client';

import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';

import { loginWithPasswordAction } from './actions';

export function LoginForm({
  next,
  email,
}: Readonly<{ next: string; email: string }>) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await loginWithPasswordAction(formData);
        });
      }}
      className="space-y-4"
    >
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
        className="w-full rounded-full bg-brand py-2 text-sm font-medium text-foreground-contrast transition-colors duration-150 hover:bg-brand-600 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </span>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}
