import { createClient as createServerClient } from '../../../lib/supabase/server';
import { adminClient } from '../../../lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Calendar } from 'lucide-react';
import { DashboardRegistrations } from './dashboard-registrations';

function computeCompleteness(profile: Record<string, unknown>): number {
  let score = 20;
  if (profile.bio) score += 10;
  if (profile.phone) score += 10;
  if (profile.city || profile.country) score += 10;
  if (profile.postal_address) score += 10;
  if (profile.avatar_url) score += 20;
  return Math.min(score, 100);
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, full_name, email, bio, phone, city, country, postal_address, avatar_url, status')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  const completeness = computeCompleteness(profile as Record<string, unknown>);

  const now = new Date().toISOString();
  const { data: registrations } = await adminClient
    .from('event_registrations')
    .select('id, status, waitlist_position, events!inner(id, title, starts_at, category)')
    .eq('profile_id', user.id)
    .in('status', ['confirmed', 'waitlisted'])
    .gte('events.starts_at', now)
    .order('events(starts_at)', { ascending: true })
    .limit(10);

  type Reg = {
    id: string;
    status: 'confirmed' | 'waitlisted';
    waitlist_position: number | null;
    events: { id: string; title: string; starts_at: string; category: string };
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-foreground">Dashboard</h1>

      {/* Completeness nudge */}
      {completeness < 80 && (
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
                <div className="h-full rounded-full bg-brand" style={{ width: `${completeness}%` }} />
              </div>
              <Link href="/profile/edit" className="mt-2 block text-xs text-brand hover:text-brand-600">
                Complete profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming registrations */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">Upcoming Events</h2>
          <Link href="/events" className="text-xs text-brand hover:text-brand-600">
            Browse events →
          </Link>
        </div>

        {(registrations ?? []).length === 0 ? (
          <div className="rounded-lg border border-default bg-surface-100 p-8 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-foreground-lighter" />
            <p className="text-sm font-medium text-foreground">No upcoming events</p>
            <p className="mt-1 text-xs text-foreground-lighter">
              Browse events and register to see them here.
            </p>
            <Link
              href="/events"
              className="mt-4 inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <DashboardRegistrations registrations={(registrations ?? []) as Reg[]} />
        )}
      </div>
    </div>
  );
}
