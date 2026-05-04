'use client';

import { useState, useRef } from 'react';
import { Search, Download, Upload, Check, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Alumni = {
  id: string;
  full_name: string | null;
  email: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  degrees?: { level: string; graduation_year: number }[];
};

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-brand/10 text-brand border-brand/30',
  pending_admin: 'bg-warning/10 text-warning border-warning/30',
  pending_email: 'bg-surface-300 text-foreground-lighter border-transparent',
  suspended: 'bg-destructive/10 text-destructive border-destructive/30',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  pending_admin: 'Pending',
  pending_email: 'Email Unverified',
  suspended: 'Suspended',
};

const STATUS_FILTERS = ['all', 'active', 'pending_admin', 'pending_email', 'suspended'] as const;

export function AlumniTable({
  alumni,
  total,
  page,
  totalPages,
  statusFilter,
}: {
  alumni: Alumni[];
  total: number;
  page: number;
  totalPages: number;
  statusFilter: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === alumni.length ? new Set() : new Set(alumni.map((a) => a.id))
    );
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const setStatus = (status: string) => {
    const params = new URLSearchParams(window.location.search);
    if (status === 'all') params.delete('status');
    else params.set('status', status);
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(p));
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (search) params.set('q', search);
    else params.delete('q');
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/admin/alumni/${id}/approve`, { method: 'POST' });
    if (res.ok) { toast.success('Alumni approved'); router.refresh(); }
    else toast.error('Failed to approve');
  };

  const handleSuspend = async (id: string) => {
    const res = await fetch(`/api/admin/alumni/${id}/suspend`, { method: 'POST' });
    if (res.ok) { toast.success('Alumni suspended'); router.refresh(); }
    else toast.error('Failed to suspend');
  };

  const handleBulkApprove = async () => {
    for (const id of selected) await handleApprove(id);
    setSelected(new Set());
  };

  const handleExport = () => {
    window.location.href = '/api/admin/export/alumni';
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const emailIdx = headers.findIndex((h) => h.toLowerCase() === 'email');
      const nameIdx = headers.findIndex((h) => h.toLowerCase() === 'full_name' || h.toLowerCase() === 'name');

      if (emailIdx === -1) {
        toast.error('CSV must have an "email" column');
        return;
      }

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        return { email: cols[emailIdx], full_name: nameIdx > -1 ? cols[nameIdx] : undefined };
      }).filter((r) => r.email);

      toast.success(`Parsed ${rows.length} records. Import via Supabase dashboard for full import.`);
    } catch {
      toast.error('Failed to parse CSV');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const activeStatus = statusFilter || 'all';

  return (
    <div>
      {/* Search + actions bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 min-w-[200px] items-center gap-2 rounded-md border border-border-control bg-surface-200 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-foreground-lighter" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alumni…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none"
          />
        </form>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 rounded-md border border-border-secondary bg-button px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-300"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 rounded-md border border-border-secondary bg-button px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-300 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
      </div>

      {/* Status filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              activeStatus === s
                ? 'bg-surface-300 text-foreground'
                : 'bg-transparent text-foreground-lighter hover:text-foreground'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-default bg-surface-100">
        <table className="w-full">
          <thead>
            <tr className="border-b border-default bg-surface-200">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.size === alumni.length && alumni.length > 0}
                  onChange={toggleAll}
                  className="accent-brand"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Programme</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Joined</th>
              <th className="w-28 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {alumni.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-foreground-lighter">
                  No alumni found.
                </td>
              </tr>
            ) : (
              alumni.map((a) => (
                <tr
                  key={a.id}
                  className={`group border-b border-muted last:border-0 hover:bg-surface-400 ${
                    selected.has(a.id) ? 'border-l-2 border-l-brand bg-surface-400' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="accent-brand"
                      aria-label={`Select ${a.full_name}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {a.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-light">{a.email}</td>
                  <td className="px-4 py-3 text-sm text-foreground-light">
                    {a.degrees?.[0]
                      ? `${a.degrees[0].level} · ${a.degrees[0].graduation_year}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded border px-2 py-0.5 text-xs ${STATUS_CLASSES[a.status] ?? 'bg-surface-300 text-foreground-lighter border-transparent'}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground-lighter">
                    {new Date(a.created_at).toLocaleDateString('en-CA')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {a.status === 'pending_admin' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(a.id)}
                          title="Approve"
                          className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-brand"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {a.status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => handleSuspend(a.id)}
                          title="Suspend"
                          className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <a
                        href={`/alumni/${a.id}`}
                        target="_blank"
                        title="View profile"
                        className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-default bg-surface-200 px-4 py-2.5">
          <p className="text-xs text-foreground-light">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[4rem] text-center text-xs text-foreground-light">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-default bg-surface-200 p-3">
          <span className="text-sm text-foreground">{selected.size} selected</span>
          <button
            type="button"
            onClick={handleBulkApprove}
            className="rounded-md border border-border-secondary bg-button px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-300"
          >
            Bulk Approve
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-foreground-lighter hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}
