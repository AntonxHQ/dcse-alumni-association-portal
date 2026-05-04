'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useState } from 'react';

import { resetPasswordAction, type ResetPasswordState } from './actions';

const initialState: ResetPasswordState = {
  error: null,
  success: false,
};

type ResetPasswordFormProps = {
  tokenHash: string;
  type: string;
};

export function ResetPasswordForm({ tokenHash, type }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const [password, setPassword] = useState('');

  if (state.success) {
    return (
      <div className="rounded-md border border-brand/30 bg-brand/10 p-4 text-sm text-brand">
        Password updated successfully.{' '}
        <Link className="text-brand transition-colors hover:text-brand-600" href="/auth/login">
          Sign in
        </Link>
        .
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input name="token_hash" type="hidden" value={tokenHash} />
      <input name="type" type="hidden" value={type} />
      <label className="block text-sm font-medium text-foreground-light">
        <span className="mb-1.5 block">New password</span>
        <input
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <button
        className="w-full rounded-full bg-brand py-2 text-sm font-medium text-foreground-contrast transition-colors duration-150 hover:bg-brand-600 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Updating password...' : 'Update password'}
      </button>
    </form>
  );
}
