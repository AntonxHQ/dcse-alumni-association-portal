import { adminClient } from '../../../../lib/supabase/admin';
import { createClient as createServerClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

const ACTION_BADGE: Record<string, string> = {
  'profile': 'bg-blue-900/30 text-blue-400 border border-blue-800/30',
  'event': 'bg-brand/10 text-brand border border-brand/30',
  'alumni': 'bg-warning/10 text-warning border border-warning/30',
  'role': 'bg-purple-900/30 text-purple-400 border border-purple-800/30',
};

function getActionBadgeClass(action: string): string {
  const prefix = action.split('.')[0];
  return ACTION_BADGE[prefix] ?? 'bg-surface-300 text-foreground-lighter border border-transparent';
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!adminRole) redirect('/dashboard');

  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const PAGE_SIZE = 50;

  const { data: logs, count } = await adminClient
    .from('audit_logs')
    .select('id, actor_id, action, target_type, target_id, metadata, created_at, profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-medium text-foreground">Audit Log</h1>
        <span className="flex items-center gap-1.5 rounded border border-border-control bg-surface-300 px-2 py-0.5 text-xs text-foreground-lighter">
          <Lock className="h-3 w-3" />
          Read-only
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-default bg-surface-100">
        <table className="w-full">
          <thead>
            <tr className="border-b border-default bg-surface-200">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Timestamp</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Actor</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Action</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Target</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Details</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-foreground-lighter">
                  No audit log entries yet.
                </td>
              </tr>
            ) : (
              (logs ?? []).map((log) => {
                const rawProfile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                const profile = rawProfile as { full_name: string | null } | null;
                return (
                  <tr key={log.id} className="border-b border-muted last:border-0 hover:bg-surface-400">
                    <td className="px-4 py-3 font-mono text-xs text-foreground-lighter whitespace-nowrap">
                      {new Date(log.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-light">
                      {profile?.full_name ?? log.actor_id?.slice(0, 8) ?? 'system'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground-lighter">
                      <span className="font-medium">{log.target_type}</span>
                      {log.target_id && (
                        <span className="ml-1 font-mono opacity-60">
                          {log.target_id.length > 12 ? log.target_id.slice(0, 8) + '…' : log.target_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <span className="font-mono text-xs text-foreground-lighter truncate block">
                          {JSON.stringify(log.metadata).slice(0, 80)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-default bg-surface-200 px-4 py-2.5">
          <p className="text-xs text-foreground-light">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}`}
                className="rounded px-2 py-1 text-xs text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
              >
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}`}
                className="rounded px-2 py-1 text-xs text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
