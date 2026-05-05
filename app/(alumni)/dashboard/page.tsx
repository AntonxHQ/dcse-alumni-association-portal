import { createClient as createServerClient } from '../../../lib/supabase/server';
import { adminClient } from '../../../lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Calendar, MapPin } from 'lucide-react';

function computeCompleteness(
  profile: Record<string, unknown>,
  hasDegrees: boolean,
  hasEmployment: boolean,
): number {
  let score = 20; // base: name + email
  if (profile.bio) score += 10;
  if (profile.phone) score += 10;
  if (profile.city || profile.country) score += 10;
  if (profile.postal_address) score += 5;
  if (profile.avatar_url) score += 15;
  if (hasDegrees) score += 15;
  if (hasEmployment) score += 15;
  return Math.min(score, 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  reunion: 'bg-brand/10 text-brand',
  networking: 'bg-blue-500/10 text-blue-400',
  webinar: 'bg-purple-500/10 text-purple-400',
  workshop: 'bg-orange-500/10 text-orange-400',
  sports: 'bg-green-500/10 text-green-400',
  cultural: 'bg-pink-500/10 text-pink-400',
};

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const now = new Date().toISOString();

  const [
    { data: profile },
    { data: degrees },
    { data: employment },
    { data: upcomingEvents },
  ] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, full_name, email, bio, phone, city, country, postal_address, avatar_url, status')
      .eq('id', user.id)
      .single(),
    adminClient.from('degrees').select('id').eq('profile_id', user.id),
    adminClient.from('employment_history').select('id').eq('profile_id', user.id).limit(1),
    adminClient
      .from('events')
      .select('id, title, starts_at, category, location, event_type')
      .eq('published', true)
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(5),
  ]);

  if (!profile) redirect('/auth/login');

  const completeness = computeCompleteness(
    profile as Record<string, unknown>,
    (degrees ?? []).length > 0,
    (employment ?? []).length > 0,
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-foreground">Dashboard</h1>

      {/* Completeness nudge */}
      {completeness < 100 && (
        <div className="mb-6 rounded-lg border border-brand/20 bg-brand/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                Your profile is{' '}
                <span className="font-medium text-brand">{completeness}%</span>{' '}
                complete. A complete profile helps you get noticed.
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-300">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${completeness}%` }} />
              </div>
              <Link href="/profile/edit" className="mt-2 block text-xs text-brand hover:text-brand-600">
                Complete profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">Upcoming Events</h2>
          <Link href="/events" className="text-xs text-brand hover:text-brand-600">
            Browse all →
          </Link>
        </div>

        {(upcomingEvents ?? []).length === 0 ? (
          <div className="rounded-lg border border-default bg-surface-100 p-8 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-foreground-lighter" />
            <p className="text-sm font-medium text-foreground">No upcoming events</p>
            <p className="mt-1 text-xs text-foreground-lighter">
              Check back soon for new events.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(upcomingEvents ?? []).map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center gap-4 rounded-lg border border-default bg-surface-100 px-4 py-3 transition-colors hover:bg-surface-200"
              >
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-surface-300 text-center">
                  <span className="text-[10px] font-medium uppercase text-foreground-lighter">
                    {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-base font-semibold leading-none text-foreground">
                    {new Date(event.starts_at).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-foreground-lighter">
                    <span>{formatDate(event.starts_at)}</span>
                    {event.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                {event.category && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${CATEGORY_COLORS[event.category] ?? 'bg-surface-300 text-foreground-lighter'}`}>
                    {event.category}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
