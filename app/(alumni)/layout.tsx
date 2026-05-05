import { createClient } from '../../lib/supabase/server';
import { adminClient } from '../../lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AlumniShell } from './alumni-shell';
import type { ReactNode } from 'react';

export default async function AlumniLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await adminClient
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  return <AlumniShell status={profile.status}>{children}</AlumniShell>;
}
