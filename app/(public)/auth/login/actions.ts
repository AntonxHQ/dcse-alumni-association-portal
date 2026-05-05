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
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/auth/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`,
    );
  }

  // Redirect admins to the admin dashboard
  const userId = authData.user?.id;
  if (userId && next === '/dashboard') {
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('profile_id', userId)
      .limit(1)
      .maybeSingle();
    if (adminRole) redirect('/admin');
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
