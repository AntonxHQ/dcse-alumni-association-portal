'use server';

import { redirect } from 'next/navigation';

import { getSiteUrl } from '../../../../lib/site-url';
import { createClient } from '../../../../lib/supabase/server';

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/')) {
    return '/dashboard';
  }
  if (next.startsWith('//')) {
    return '/dashboard';
  }
  return next;
}

export async function loginWithPasswordAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNextPath(String(formData.get('next') ?? '') || null);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/auth/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`,
    );
  }

  redirect(next);
}

export async function loginWithGoogleAction(formData: FormData) {
  const next = safeNextPath(String(formData.get('next') ?? '') || null);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getSiteUrl('/auth/callback'),
      queryParams: {
        next,
      },
    },
  });

  if (error || !data.url) {
    redirect('/auth/login?error=oauth_failed');
  }

  redirect(data.url);
}

export async function loginWithLinkedInAction(formData: FormData) {
  const next = safeNextPath(String(formData.get('next') ?? '') || null);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: getSiteUrl('/auth/callback'),
      queryParams: {
        next,
      },
    },
  });

  if (error || !data.url) {
    redirect('/auth/login?error=oauth_failed');
  }

  redirect(data.url);
}
