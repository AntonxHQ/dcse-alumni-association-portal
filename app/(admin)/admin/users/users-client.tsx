'use client';

import { Search, Shield, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Admin = {
  id: string;
  role: 'super_admin' | 'admin';
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

const ROLE_META = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full access including user management',
    icon: ShieldCheck,
    classes: 'bg-brand/10 text-brand border-brand/30',
  },
  admin: {
    label: 'Admin',
    description: 'Full access excluding user management',
    icon: Shield,
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
};

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function UsersClient({ admins, currentUserId }: { admins: Admin[]; currentUserId: string }) {
  const router = useRouter();
  const [searchEmail, setSearchEmail] = useState('');
  const [assignRole, setAssignRole] = useState<'admin' | 'super_admin'>('admin');
  const [assigning, setAssigning] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/users/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail.trim(), role: assignRole }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? 'Failed to assign role'); return; }
      toast.success(`Role assigned successfully`);
      setSearchEmail('');
      router.refresh();
    } finally {
      setAssigning(false);
    }
  }

  async function handleRevoke(adminId: string, name: string | null) {
    if (adminId === currentUserId) { toast.error("You can't revoke your own role"); return; }
    setRevoking(adminId);
    try {
      const res = await fetch('/api/admin/users/revoke-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminId }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? 'Failed to revoke role'); return; }
      toast.success(`Removed admin access for ${name ?? 'user'}`);
      router.refresh();
    } finally {
      setRevoking(null);
    }
  }

  async function handleChangeRole(adminId: string, newRole: 'admin' | 'super_admin') {
    if (adminId === currentUserId) { toast.error("You can't change your own role"); return; }
    setUpdating(adminId);
    try {
      const res = await fetch('/api/admin/users/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminId, role: newRole }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? 'Failed to update role'); return; }
      toast.success('Role updated');
      router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Assign new admin */}
      <section className="rounded-lg border border-default bg-surface-100 p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-medium text-foreground">Add Admin</h2>
        </div>
        <form onSubmit={handleAssign} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-foreground-light">
              User email
            </label>
            <div className="flex items-center gap-2 rounded-md border border-border-control bg-surface-200 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-foreground-lighter" />
              <input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter registered user email…"
                type="email"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="mb-1.5 block text-xs font-medium text-foreground-light">Role</label>
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value as 'admin' | 'super_admin')}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={assigning || !searchEmail.trim()}
            className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {assigning ? 'Assigning…' : 'Assign Role'}
          </button>
        </form>

        {/* Role descriptions */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(ROLE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key} className="flex items-start gap-3 rounded-md border border-border-muted bg-surface-200 p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-lighter" />
                <div>
                  <p className="text-xs font-medium text-foreground">{meta.label}</p>
                  <p className="mt-0.5 text-xs text-foreground-lighter">{meta.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Current admins */}
      <section className="rounded-lg border border-default bg-surface-100">
        <div className="border-b border-default px-5 py-4">
          <h2 className="text-sm font-medium text-foreground">
            Current Admins
            <span className="ml-2 rounded-full bg-surface-300 px-2 py-0.5 text-xs text-foreground-lighter">
              {admins.length}
            </span>
          </h2>
        </div>

        {admins.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-foreground-lighter">No admins found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-default bg-surface-200">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-lighter">Role</th>
                <th className="w-32 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const meta = ROLE_META[admin.role];
                const isSelf = admin.id === currentUserId;
                return (
                  <tr key={admin.id} className="group border-b border-muted last:border-0 hover:bg-surface-200">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {admin.avatar_url ? (
                          <Image
                            src={admin.avatar_url}
                            alt={admin.full_name ?? ''}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-300 text-xs font-medium text-foreground-light">
                            {initials(admin.full_name, admin.email)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {admin.full_name ?? '—'}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-foreground-lighter">(you)</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-foreground-lighter">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {isSelf ? (
                        <span className={`rounded border px-2 py-0.5 text-xs ${meta.classes}`}>
                          {meta.label}
                        </span>
                      ) : (
                        <select
                          value={admin.role}
                          disabled={updating === admin.id}
                          onChange={(e) => handleChangeRole(admin.id, e.target.value as 'admin' | 'super_admin')}
                          className="w-36 rounded border border-border-control bg-surface-200 px-2 py-1 text-xs text-foreground"
                        >
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {!isSelf && (
                        <button
                          type="button"
                          disabled={revoking === admin.id}
                          onClick={() => handleRevoke(admin.id, admin.full_name)}
                          title="Remove admin access"
                          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-foreground-lighter transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {revoking === admin.id ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
