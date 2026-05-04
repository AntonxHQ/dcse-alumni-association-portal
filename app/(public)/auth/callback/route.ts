import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url));
  }

  let fullName = '';
  if (typeof user.user_metadata?.full_name === 'string') {
    fullName = user.user_metadata.full_name;
  } else if (typeof user.user_metadata?.name === 'string') {
    fullName = user.user_metadata.name;
  }

  let registrationStep = 0;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('registration_step')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    registrationStep = existingProfile.registration_step ?? 0;
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? '',
    full_name: fullName,
    status: 'pending_admin',
    registration_step: registrationStep,
  });

  if (profileError) {
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url));
  }

  if (registrationStep < 6) {
    return NextResponse.redirect(new URL('/auth/register', request.url));
  }

  return NextResponse.redirect(new URL('/profile/edit', request.url));
}
