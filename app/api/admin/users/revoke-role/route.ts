import { NextResponse } from 'next/server';

import { adminClient } from '../../../../../lib/supabase/admin';
import { createClient } from '../../../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify caller is a super_admin
  const { data: callerRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (callerRole?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can revoke roles' }, { status: 403 });
  }

  const body = await request.json() as { userId: string };
  const { userId } = body;

  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  // Prevent revoking own role
  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot revoke your own admin role" }, { status: 400 });
  }

  const { error } = await adminClient
    .from('admin_roles')
    .delete()
    .eq('profile_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
