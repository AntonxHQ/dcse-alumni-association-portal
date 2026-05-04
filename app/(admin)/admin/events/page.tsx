import { adminClient } from '../../../../lib/supabase/admin';
import { createClient as createServerClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminEventsClient } from './events-client';

export default async function AdminEventsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!adminRole) redirect('/dashboard');

  const { data: events } = await adminClient
    .from('events')
    .select('id, title, category, event_type, starts_at, ends_at, published, capacity, description, location, allows_guests, is_paid, price, cancel_cutoff_hours')
    .order('starts_at', { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);
  let confirmedCounts: Record<string, number> = {};

  if (eventIds.length > 0) {
    const { data: regData } = await adminClient
      .from('event_registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'confirmed');

    for (const row of regData ?? []) {
      confirmedCounts[row.event_id] = (confirmedCounts[row.event_id] ?? 0) + 1;
    }
  }

  const eventsWithCounts = (events ?? []).map((e) => ({
    ...e,
    confirmed_count: confirmedCounts[e.id] ?? 0,
  }));

  return (
    <AdminEventsClient events={eventsWithCounts as Parameters<typeof AdminEventsClient>[0]['events']} />
  );
}
