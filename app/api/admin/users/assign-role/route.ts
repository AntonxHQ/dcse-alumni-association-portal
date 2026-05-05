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
    return NextResponse.json({ error: 'Only super admins can assign roles' }, { status: 403 });
  }

  const body = await request.json() as { email?: string; userId?: string; role: 'admin' | 'super_admin' };
  const { email, userId, role } = body;

  if (!['admin', 'super_admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  let targetId = userId;

  // If email is provided, look up the profile
  if (!targetId && email) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'No registered user found with that email' }, { status: 404 });
    }
    targetId = profile.id as string;
  }

  if (!targetId) {
    return NextResponse.json({ error: 'User not specified' }, { status: 400 });
  }

  // Upsert the role (update if exists, insert if not)
  const { error } = await adminClient
    .from('admin_roles')
    .upsert({ profile_id: targetId, role }, { onConflict: 'profile_id,role' });

  // If upsert didn't update (different role exists), delete old and insert new
  if (error) {
    await adminClient.from('admin_roles').delete().eq('profile_id', targetId);
    const { error: insertError } = await adminClient
      .from('admin_roles')
      .insert({ profile_id: targetId, role });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  } else {
    // Ensure only one role row per user (delete any other roles for this user)
    await adminClient
      .from('admin_roles')
      .delete()
      .eq('profile_id', targetId)
      .neq('role', role);
  }

  return NextResponse.json({ success: true });
}
