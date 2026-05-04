'use client';

import { useActionState } from 'react';

import { forgotPasswordAction, type ForgotPasswordState } from './actions';

const initialState: ForgotPasswordState = {
  error: null,
  success: false,
  fields: {
    email: '',
  },
};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium text-foreground-light">
        <span className="mb-1.5 block">Email</span>
        <input defaultValue={state.fields.email} name="email" required type="email" />
      </label>

      {state.success ? (
        <p className="text-xs text-brand">
          If this email exists, a password reset link has been sent.
        </p>
      ) : null}
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}

      <button
        className="w-full rounded-full bg-brand py-2 text-sm font-medium text-foreground-contrast transition-colors duration-150 hover:bg-brand-600 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Sending reset link...' : 'Send reset link'}
      </button>
    </form>
  );
}
