import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { createClient } from '../../lib/supabase/server';
import { adminClient } from '../../lib/supabase/admin';
import { AdminSidebar } from './admin-sidebar';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!adminRole) redirect('/dashboard');

  const isSuperAdmin = adminRole.role === 'super_admin';

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/admin';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar isSuperAdmin={isSuperAdmin} pathname={pathname} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-12 border-b border-default bg-surface-100 px-6">
          <div className="flex h-full items-center justify-between">
            <p className="text-[13px] text-foreground-light">Admin</p>
            <span className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${isSuperAdmin ? 'bg-brand/10 text-brand' : 'bg-surface-300 text-foreground-lighter'}`}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-dash-canvas p-6">{children}</main>
      </div>
    </div>
  );
}
