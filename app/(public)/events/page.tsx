import { createAnonServerClient } from '../../../lib/supabase/anon-server';
import { EventsClient } from './events-client';
import type { EventItem } from '../../../components/events/event-card';

export const revalidate = 60;

async function getEvents(searchParams: Record<string, string>): Promise<EventItem[]> {
  const supabase = await createAnonServerClient();

  let query = supabase
    .from('events')
    .select('id, title, category, event_type, starts_at, ends_at, location, capacity, is_paid, price')
    .eq('published', true)
    .order('starts_at', { ascending: true });

  if (searchParams.category) query = query.eq('category', searchParams.category);
  if (searchParams.event_type) query = query.eq('event_type', searchParams.event_type);

  const { data } = await query;
  const events = data ?? [];

  if (events.length === 0) return [];

  const eventIds = events.map((e) => e.id);
  const { data: regData } = await supabase
    .from('event_registrations')
    .select('event_id')
    .in('event_id', eventIds)
    .eq('status', 'confirmed');

  const confirmedCounts: Record<string, number> = {};
  for (const row of regData ?? []) {
    confirmedCounts[row.event_id] = (confirmedCounts[row.event_id] ?? 0) + 1;
  }

  const withCounts = events.map((e) => ({
    ...e,
    confirmed_count: confirmedCounts[e.id] ?? 0,
  })) as EventItem[];

  if (searchParams.availability === 'available') {
    return withCounts.filter((e) => e.capacity == null || e.confirmed_count < e.capacity);
  }

  return withCounts;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const events = await getEvents(params);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <h1 className="mb-6 text-2xl font-medium text-foreground">Events</h1>
      <EventsClient events={events} />
    </div>
  );
}
