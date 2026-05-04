'use server';

import { getSiteUrl } from '../../../../lib/site-url';
import { createClient } from '../../../../lib/supabase/server';

export type ForgotPasswordState = {
  error: string | null;
  success: boolean;
  fields: {
    email: string;
  };
};

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = getFormValue(formData, 'email').trim();
  if (!email) {
    return {
      error: 'Please provide your account email.',
      success: false,
      fields: { email },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getSiteUrl('/auth/reset-password'),
  });

  if (error) {
    return { error: error.message, success: false, fields: { email } };
  }

  return { error: null, success: true, fields: { email: '' } };
}
