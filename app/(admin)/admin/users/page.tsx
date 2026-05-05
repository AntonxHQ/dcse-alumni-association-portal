import { redirect } from 'next/navigation';

import { createClient } from '../../../../lib/supabase/server';
import { adminClient } from '../../../../lib/supabase/admin';
import { UsersClient } from './users-client';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Only super_admins can access this page
  const { data: myRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (myRole?.role !== 'super_admin') redirect('/admin');

  // Fetch all current admins with their profile info
  const { data: adminRows } = await adminClient
    .from('admin_roles')
    .select('profile_id, role')
    .in('role', ['super_admin', 'admin']);

  const adminIds = (adminRows ?? []).map((r) => r.profile_id);

  const { data: profiles } = adminIds.length > 0
    ? await adminClient
        .from('profiles')
        .select('id, full_name, email, avatar_url, created_at')
        .in('id', adminIds)
    : { data: [] };

  const admins = (adminRows ?? []).map((row) => {
    const profile = (profiles ?? []).find((p) => p.id === row.profile_id);
    return {
      id: row.profile_id as string,
      role: row.role as 'super_admin' | 'admin',
      full_name: (profile?.full_name as string | null) ?? null,
      email: (profile?.email as string) ?? '',
      avatar_url: (profile?.avatar_url as string | null) ?? null,
      created_at: (profile?.created_at as string) ?? '',
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-foreground-light">
          Assign and manage admin roles. Only super admins can access this page.
        </p>
      </div>
      <UsersClient admins={admins} currentUserId={user.id} />
    </div>
  );
}
