import { createAnonServerClient } from '../../../../lib/supabase/anon-server';
import { createClient as createServerClient } from '../../../../lib/supabase/server';
import { adminClient } from '../../../../lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createAnonServerClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const { count: confirmedCount } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'confirmed');

  const { count: waitlistCount } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'waitlisted');

  return NextResponse.json({
    ...event,
    confirmed_count: confirmedCount ?? 0,
    waitlist_count: waitlistCount ?? 0,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRole } = await adminClient
    .from('admin_roles').select('role').eq('profile_id', user.id).maybeSingle();
  if (!adminRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { data, error } = await adminClient
    .from('events')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'event.updated',
    target_type: 'event',
    target_id: id,
    metadata: { title: data.title },
  });

  return NextResponse.json(data);
}
