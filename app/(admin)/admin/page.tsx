import { adminClient } from '../../../lib/supabase/admin';
import { createClient as createServerClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { StatCard } from '../../../components/ui/stat-card';
import { AlumniGrowthChart } from './admin-chart';
import { BatchBarChart } from './batch-chart';
import { Users, UserCheck, UserRound, Calendar, ClipboardList, AlertCircle } from 'lucide-react';
import Link from 'next/link';

async function getKPIs() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalAlumni },
    { count: newRegistrations },
    { count: pendingApprovals },
    { count: upcomingEvents },
    { count: totalRegistrations },
  ] = await Promise.all([
    adminClient.from('profiles').select('id', { count: 'exact', head: true }),
    adminClient.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_admin'),
    adminClient.from('events').select('id', { count: 'exact', head: true }).eq('published', true).gte('starts_at', now.toISOString()),
    adminClient.from('event_registrations').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ]);

  // Active alumni (logged in last 90 days) - approximate using profiles updated_at or created_at
  const { count: activeAlumni } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('updated_at', ninetyDaysAgo);

  return {
    totalAlumni: totalAlumni ?? 0,
    newRegistrations: newRegistrations ?? 0,
    activeAlumni: activeAlumni ?? 0,
    upcomingEvents: upcomingEvents ?? 0,
    totalRegistrations: totalRegistrations ?? 0,
    pendingApprovals: pendingApprovals ?? 0,
  };
}

async function getBatchBreakdown() {
  const { data } = await adminClient
    .from('degrees')
    .select('level, intake_year, profile_id')
    .not('intake_year', 'is', null);

  const rows = data ?? [];

  const grouped: Record<string, Map<number, Set<string>>> = {
    BS: new Map(),
    MS: new Map(),
    PhD: new Map(),
  };

  for (const row of rows) {
    if (!row.intake_year || !(row.level in grouped)) continue;
    const byYear = grouped[row.level];
    if (!byYear.has(row.intake_year)) byYear.set(row.intake_year, new Set());
    byYear.get(row.intake_year)?.add(row.profile_id);
  }

  const bs = Array.from(grouped.BS.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, ids]) => ({ label: `Batch ${year - 1998}`, count: ids.size }));

  const ms = Array.from(grouped.MS.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, ids]) => ({ label: String(year), count: ids.size }));

  const phd = Array.from(grouped.PhD.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, ids]) => ({ label: String(year), count: ids.size }));

  return { bs, ms, phd };
}

async function getGrowthData(): Promise<{ month: string; count: number }[]> {
  const months: { month: string; count: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();

    const { count } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', start)
      .lt('created_at', end);

    months.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      count: count ?? 0,
    });
  }
  return months;
}

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!adminRole) redirect('/dashboard');

  const [kpis, growthData, batchBreakdown] = await Promise.all([
    getKPIs(),
    getGrowthData(),
    getBatchBreakdown(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-foreground">Dashboard</h1>

      {/* KPI grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Alumni"
          value={kpis.totalAlumni.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="New (Last 30 Days)"
          value={kpis.newRegistrations.toLocaleString()}
          icon={<UserCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Active Alumni (90 Days)"
          value={kpis.activeAlumni.toLocaleString()}
          icon={<UserRound className="h-4 w-4" />}
        />
        <StatCard
          label="Upcoming Events"
          value={kpis.upcomingEvents.toLocaleString()}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="Total Registrations"
          value={kpis.totalRegistrations.toLocaleString()}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <article
          className={`rounded-lg border p-5 transition-colors duration-150 hover:border-border-secondary ${
            kpis.pendingApprovals > 0
              ? 'border-brand/30 bg-brand/5'
              : 'border-border bg-surface-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-mono tracking-wide text-foreground-lighter uppercase">
              Pending Approvals
            </p>
            <AlertCircle className="h-4 w-4 text-foreground-lighter" />
          </div>
          <p className="mt-2 text-2xl font-medium text-foreground">{kpis.pendingApprovals}</p>
          {kpis.pendingApprovals > 0 && (
            <Link
              href="/admin/alumni?status=pending_admin"
              className="mt-1 block text-xs text-brand hover:text-brand-600"
            >
              Review now →
            </Link>
          )}
        </article>
      </div>

      {/* Growth chart */}
      <AlumniGrowthChart data={growthData} />

      {/* Batch-wise registrations */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BatchBarChart data={batchBreakdown.bs} title="BS — Registrations by Batch" />
        <BatchBarChart data={batchBreakdown.ms} title="MS — Registrations by Intake Year" />
        <BatchBarChart data={batchBreakdown.phd} title="PhD — Registrations by Intake Year" />
      </div>
    </div>
  );
}
