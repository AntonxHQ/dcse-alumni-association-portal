import { createClient as createServerClient } from '../../../../../lib/supabase/server';
import { createAnonServerClient } from '../../../../../lib/supabase/anon-server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { RegistrationForm } from './registration-form';
import { adminClient } from '../../../../../lib/supabase/admin';

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  reunion: 'border-t-brand',
  networking: 'border-t-blue-500',
  webinar: 'border-t-purple-500',
  workshop: 'border-t-amber-500',
  sports: 'border-t-orange-500',
  cultural: 'border-t-pink-500',
};

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth check
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, full_name, email, status, bio, phone')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'active') redirect('/dashboard');

  // Fetch event
  const anonClient = await createAnonServerClient();
  const { data: event } = await anonClient
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single();

  if (!event) notFound();

  // Confirmed count
  const { count: confirmedCount } = await adminClient
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'confirmed');

  // Check existing registration
  const { data: existing } = await adminClient
    .from('event_registrations')
    .select('id, status, waitlist_position')
    .eq('event_id', id)
    .eq('profile_id', profile.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  const capacityPct =
    event.capacity != null
      ? Math.min(100, Math.round(((confirmedCount ?? 0) / event.capacity) * 100))
      : 0;

  const accentTop = CATEGORY_BORDER_COLORS[event.category] ?? 'border-t-surface-300';

  const dateStr = new Date(event.starts_at).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="flex-1 overflow-auto p-6 bg-dash-canvas">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-xs text-foreground-lighter">
        <Link href="/events" className="hover:text-foreground">Events</Link>
        <span>/</span>
        <Link href={`/events/${id}`} className="hover:text-foreground truncate max-w-[200px]">{event.title}</Link>
        <span>/</span>
        <span className="text-foreground">Register</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <RegistrationForm
          event={event}
          profile={profile}
          confirmedCount={confirmedCount ?? 0}
          existingRegistration={existing}
        />

        {/* Summary card */}
        <div className="lg:sticky lg:top-6">
          <div className={`rounded-lg border border-default bg-surface-100 border-t-4 ${accentTop} overflow-hidden`}>
            <div className="p-5">
              <p className="text-base font-medium text-foreground">{event.title}</p>
              <p className="mt-1 text-xs text-foreground-lighter">{dateStr}</p>
              <p className="text-xs text-foreground-lighter">{event.location ?? 'Online'}</p>

              {event.capacity != null && (
                <div className="mt-4 border-t border-muted pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-foreground-lighter">
                    <span>{confirmedCount ?? 0} / {event.capacity} spots filled</span>
                    <span className="text-foreground-lighter">{capacityPct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-300">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${capacityPct}%` }} />
                  </div>
                </div>
              )}

              {event.is_paid && event.price != null && (
                <p className="mt-4 text-lg font-medium text-foreground">${event.price}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
