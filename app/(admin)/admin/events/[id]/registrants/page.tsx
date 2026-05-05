import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle, Clock, XCircle, BarChart2 } from 'lucide-react';

import { adminClient } from '../../../../../../lib/supabase/admin';
import { createClient } from '../../../../../../lib/supabase/server';

const CATEGORY_COLORS: Record<string, string> = {
  reunion: 'bg-brand/10 text-brand border-brand/30',
  networking: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  webinar: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  workshop: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  sports: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  cultural: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

const STATUS_META = {
  confirmed: { label: 'Confirmed', icon: CheckCircle, classes: 'bg-brand/10 text-brand border-brand/30' },
  waitlisted: { label: 'Waitlisted', icon: Clock, classes: 'bg-warning/10 text-warning border-warning/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, classes: 'bg-destructive/10 text-destructive border-destructive/30' },
};

function fmt(date: string) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function fmtShort(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default async function EventRegistrantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth guard — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!adminRole) redirect('/dashboard');

  // Fetch event
  const { data: event } = await adminClient
    .from('events')
    .select('id, title, description, category, event_type, starts_at, ends_at, location, capacity, published, is_paid, price, allows_guests')
    .eq('id', id)
    .single();

  if (!event) notFound();

  // Fetch all registrations with profile info
  const { data: regs } = await adminClient
    .from('event_registrations')
    .select('id, status, waitlist_position, dietary_requirements, guest_count, registered_at, profile_id')
    .eq('event_id', id)
    .order('registered_at', { ascending: true });

  const allRegs = regs ?? [];
  const profileIds = allRegs.map((r) => r.profile_id);

  const { data: profiles } = profileIds.length > 0
    ? await adminClient
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', profileIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const registrants = allRegs.map((r) => ({
    ...r,
    profile: profileMap[r.profile_id] ?? null,
  }));

  // Analytics
  const confirmed = registrants.filter((r) => r.status === 'confirmed');
  const waitlisted = registrants.filter((r) => r.status === 'waitlisted');
  const cancelled = registrants.filter((r) => r.status === 'cancelled');
  const capacityPct = event.capacity
    ? Math.min(100, Math.round((confirmed.length / event.capacity) * 100))
    : null;

  const categoryBadge = CATEGORY_COLORS[event.category] ?? 'bg-surface-300 text-foreground-lighter border-transparent';

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/events"
          className="flex items-center gap-1.5 text-sm text-foreground-lighter transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Events
        </Link>
        <span className="text-foreground-muted">/</span>
        <span className="text-sm text-foreground truncate max-w-xs">{event.title}</span>
      </div>

      {/* Event summary card */}
      <div className="rounded-lg border border-default bg-surface-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded border px-2 py-0.5 text-xs ${categoryBadge}`}>
                {event.category}
              </span>
              <span className={`rounded border px-2 py-0.5 text-xs ${event.published ? 'bg-brand/10 text-brand border-brand/30' : 'bg-surface-300 text-foreground-lighter border-transparent'}`}>
                {event.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="text-xl font-medium text-foreground">{event.title}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-foreground-light">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0" />
                {fmt(event.starts_at)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          {event.is_paid && event.price != null && (
            <span className="rounded-md bg-surface-300 px-3 py-1.5 text-sm font-medium text-foreground">
              ${event.price}
            </span>
          )}
        </div>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Confirmed"
          value={confirmed.length}
          sub={event.capacity ? `of ${event.capacity}` : 'no cap'}
          icon={<CheckCircle className="h-4 w-4 text-brand" />}
          accent="text-brand"
        />
        <StatCard
          label="Waitlisted"
          value={waitlisted.length}
          icon={<Clock className="h-4 w-4 text-warning" />}
          accent="text-warning"
        />
        <StatCard
          label="Cancelled"
          value={cancelled.length}
          icon={<XCircle className="h-4 w-4 text-destructive" />}
          accent="text-destructive"
        />
        <StatCard
          label="Total registrations"
          value={allRegs.length}
          icon={<Users className="h-4 w-4 text-foreground-lighter" />}
          accent="text-foreground"
        />
      </div>

      {/* Capacity bar */}
      {capacityPct !== null && (
        <div className="rounded-lg border border-default bg-surface-100 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BarChart2 className="h-4 w-4 text-foreground-lighter" />
              Capacity
            </div>
            <span className="text-sm text-foreground-lighter">{capacityPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-300">
            <div
              className={`h-full rounded-full transition-all ${capacityPct >= 100 ? 'bg-warning' : 'bg-brand'}`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-foreground-lighter">
            {confirmed.length} confirmed · {(event.capacity ?? 0) - confirmed.length} spots remaining
          </p>
        </div>
      )}

      {/* Registrants table */}
      <div className="rounded-lg border border-default bg-surface-100">
        <div className="flex items-center justify-between border-b border-default px-5 py-4">
          <h2 className="text-sm font-medium text-foreground">
            Registrants
            <span className="ml-2 rounded-full bg-surface-300 px-2 py-0.5 text-xs text-foreground-lighter">
              {registrants.length}
            </span>
          </h2>
        </div>

        {registrants.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-foreground-lighter">No registrations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-default bg-surface-200">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Attendee</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Registered</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Guests</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Dietary</th>
                </tr>
              </thead>
              <tbody>
                {registrants.map((reg) => {
                  const meta = STATUS_META[reg.status as keyof typeof STATUS_META] ?? STATUS_META.confirmed;
                  const StatusIcon = meta.icon;
                  const profile = reg.profile;
                  return (
                    <tr key={reg.id} className="border-b border-muted last:border-0 hover:bg-surface-200">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-300 text-xs font-medium text-foreground-light">
                            {profile?.full_name
                              ? profile.full_name.split(' ').map((p: string) => p[0] ?? '').join('').slice(0, 2).toUpperCase()
                              : '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {profile?.full_name ?? '—'}
                            </p>
                            <p className="truncate text-xs text-foreground-lighter">{profile?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs ${meta.classes}`}>
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                          {reg.status === 'waitlisted' && reg.waitlist_position && (
                            <span className="ml-0.5 text-[10px]">#{reg.waitlist_position}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-foreground-lighter">
                        {fmtShort(reg.registered_at)}
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground-light">
                        {reg.guest_count > 0 ? `+${reg.guest_count}` : '—'}
                      </td>
                      <td className="px-5 py-3 max-w-[200px]">
                        <p className="truncate text-xs text-foreground-lighter" title={reg.dietary_requirements ?? ''}>
                          {reg.dietary_requirements || '—'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-default bg-surface-100 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground-lighter">{label}</p>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-foreground-muted">{sub}</p>}
    </div>
  );
}
