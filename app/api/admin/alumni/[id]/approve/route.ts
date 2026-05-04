import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '../../../../../../lib/supabase/server';
import { adminClient } from '../../../../../../lib/supabase/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!adminRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await adminClient
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'alumni.approved',
    target_type: 'profile',
    target_id: id,
    metadata: {},
  });

  return NextResponse.json({ success: true });
}
