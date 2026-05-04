import { createAnonServerClient } from '../../../lib/supabase/anon-server';
import { createClient as createServerClient } from '../../../lib/supabase/server';
import { adminClient } from '../../../lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');
  const eventType = searchParams.get('event_type');
  const availability = searchParams.get('availability');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = 20;

  const supabase = await createAnonServerClient();

  let query = supabase
    .from('events')
    .select(
      `id, title, description, category, event_type, starts_at, ends_at, location,
       capacity, allows_guests, is_paid, price, published, created_at,
       event_registrations!inner(status)`,
      { count: 'exact' }
    )
    .eq('published', true)
    .order('starts_at', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (category) query = query.eq('category', category);
  if (eventType) query = query.eq('event_type', eventType);

  const { data: rawData, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute confirmed_count per event via a separate query
  const eventIds = (rawData ?? []).map((e: Record<string, unknown>) => e.id as string);

  let confirmedCounts: Record<string, number> = {};
  if (eventIds.length > 0) {
    const { data: regData } = await supabase
      .from('event_registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'confirmed');

    if (regData) {
      for (const row of regData) {
        confirmedCounts[row.event_id] = (confirmedCounts[row.event_id] ?? 0) + 1;
      }
    }
  }

  // Re-fetch without the join issue
  const { data, error: err2 } = await supabase
    .from('events')
    .select('id, title, description, category, event_type, starts_at, ends_at, location, capacity, allows_guests, is_paid, price, published, created_at')
    .eq('published', true)
    .order('starts_at', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (err2) {
    return NextResponse.json({ error: err2.message }, { status: 500 });
  }

  const events = (data ?? []).map((e) => ({
    ...e,
    confirmed_count: confirmedCounts[e.id] ?? 0,
  }));

  // Filter by availability after computing counts
  const filtered = availability === 'available'
    ? events.filter((e) => e.capacity == null || e.confirmed_count < e.capacity)
    : events;

  return NextResponse.json({
    data: filtered,
    total_count: count ?? 0,
    page,
    total_pages: Math.ceil((count ?? 0) / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRole } = await adminClient
    .from('admin_roles').select('role').eq('profile_id', user.id).maybeSingle();
  if (!adminRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { data, error } = await adminClient
    .from('events')
    .insert({ ...body, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'event.created',
    target_type: 'event',
    target_id: data.id,
    metadata: { title: data.title },
  });

  return NextResponse.json(data, { status: 201 });
}
