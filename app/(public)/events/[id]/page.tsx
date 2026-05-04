import { createAnonServerClient } from '../../../../lib/supabase/anon-server';
import { createClient as createServerClient } from '../../../../lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Video, Monitor, Clock, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  reunion: 'border-l-brand',
  networking: 'border-l-blue-500',
  webinar: 'border-l-purple-500',
  workshop: 'border-l-amber-500',
  sports: 'border-l-orange-500',
  cultural: 'border-l-pink-500',
};

const CATEGORY_BG_COLORS: Record<string, string> = {
  reunion: 'bg-brand/10 text-brand border-brand/30',
  networking: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  webinar: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  workshop: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  sports: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  cultural: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  capacity: number | null;
  is_paid: boolean;
  price: number | null;
  confirmed_count: number;
};

async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createAnonServerClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single();
  if (!data) return null;

  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'confirmed');

  return { ...data, confirmed_count: count ?? 0 };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: 'Event · CSE Alumni Events' };
  return {
    title: `${event.title} · CSE Alumni Events`,
    description: event.description?.slice(0, 160) ?? undefined,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  // Check if user is logged in
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isFull = event.capacity != null && event.confirmed_count >= event.capacity;
  const capacityPct =
    event.capacity != null
      ? Math.min(100, Math.round((event.confirmed_count / event.capacity) * 100))
      : 0;

  const dateStr = new Date(event.starts_at).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const accentBorder = CATEGORY_BORDER_COLORS[event.category] ?? 'border-l-surface-300';
  const categoryBadge = CATEGORY_BG_COLORS[event.category] ?? 'bg-surface-300 text-foreground-lighter border-transparent';

  const eventTypeLabel =
    event.event_type === 'in_person'
      ? 'In-person'
      : event.event_type === 'virtual'
        ? 'Virtual'
        : 'Hybrid';

  const EventTypeIcon =
    event.event_type === 'in_person' ? MapPin : event.event_type === 'virtual' ? Video : Monitor;

  return (
    <>
      {/* Hero */}
      <div className="border-b border-default bg-surface-100 py-10">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className={`border-l-4 pl-5 ${accentBorder}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded border px-2 py-0.5 text-xs ${categoryBadge}`}>
                {event.category}
              </span>
              <span className="rounded border border-border-control bg-surface-300 px-2 py-0.5 text-xs text-foreground-lighter">
                {eventTypeLabel}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-medium text-foreground">{event.title}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-foreground-light">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1.5">
                <EventTypeIcon className="h-4 w-4" />
                {event.location ?? 'Online'}
              </span>
              {event.ends_at && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Until {new Date(event.ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left: description */}
          <div>
            {event.description ? (
              <div
                className="prose prose-invert max-w-none text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            ) : (
              <p className="text-sm text-foreground-lighter">No description provided.</p>
            )}
          </div>

          {/* Right: registration card */}
          <div className="lg:sticky lg:top-6">
            <div className="rounded-lg border border-default bg-surface-100 p-5">
              <h2 className="text-sm font-medium text-foreground">Registration</h2>

              {event.capacity != null && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-foreground-lighter">
                      {event.confirmed_count} of {event.capacity} spots filled
                    </span>
                    {isFull && (
                      <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[11px] text-warning">Full</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-300">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                </div>
              )}

              {event.is_paid && event.price != null && (
                <p className="mt-4 text-lg font-medium text-foreground">${event.price}</p>
              )}

              <div className="mt-4">
                {user ? (
                  <Link
                    href={`/events/${event.id}/register`}
                    className="flex w-full items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  >
                    {isFull ? 'Join Waitlist' : 'Register for Event'}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex w-full items-center justify-center rounded-full bg-surface-300 px-4 py-2 text-sm text-foreground-light transition-colors hover:bg-surface-400"
                  >
                    Log in to register
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
