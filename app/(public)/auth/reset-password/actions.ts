'use server';

import { type EmailOtpType } from '@supabase/supabase-js';

import { createClient } from '../../../../lib/supabase/server';

export type ResetPasswordState = {
  error: string | null;
  success: boolean;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const tokenHash = String(formData.get('token_hash') ?? '');
  const type = String(formData.get('type') ?? '') as EmailOtpType;
  const password = String(formData.get('password') ?? '');

  if (!tokenHash || !type || !password) {
    return { error: 'Reset token or password is missing.', success: false };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (verifyError) {
    return { error: verifyError.message, success: false };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
  });

  if (updateError) {
    return { error: updateError.message, success: false };
  }

  return { error: null, success: true };
}
