'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alumni', label: 'Alumni', icon: Users },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile/edit', label: 'My Profile', icon: User },
];

const UNLOCKED_PATHS = ['/profile/edit'];

type AlumniShellProps = Readonly<{
  children: ReactNode;
  status: string;
}>;

export function AlumniShell({ children, status }: AlumniShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const isPending = status === 'pending_admin' || status === 'pending_email';
  const isCurrentPathLocked =
    isPending &&
    !UNLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`flex-shrink-0 border-r border-default bg-dash-sidebar transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between border-b border-default px-3 py-3">
          <p
            className={`truncate text-sm font-medium text-foreground transition-opacity ${
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            DCSE Alumni Association
          </p>
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-md border border-secondary bg-button p-1.5 text-foreground-light transition-colors hover:text-foreground"
            onClick={() => setCollapsed((v) => !v)}
            type="button"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {isPending && !collapsed && (
          <div className="mx-2 mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0 text-amber-400" />
              <p className="text-[11px] font-medium text-amber-400">
                Pending approval
              </p>
            </div>
            <p className="mt-0.5 text-[10px] leading-relaxed text-amber-300/70">
              Complete your profile while you wait.
            </p>
          </div>
        )}

        <nav className="px-2 py-4">
          {collapsed ? null : (
            <p className="mb-2 px-3 text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
              Alumni
            </p>
          )}
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isItemUnlocked = UNLOCKED_PATHS.includes(item.href);
            const isItemLocked = isPending && !isItemUnlocked;

            let linkClass = 'border-transparent text-foreground-light hover:bg-surface-200 hover:text-foreground';
            if (isActive) {
              linkClass = 'border-brand bg-surface-300 text-brand';
            } else if (isItemLocked) {
              linkClass = 'border-transparent text-foreground-muted hover:bg-surface-200 hover:text-foreground-light';
            }

            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={`mb-1 flex items-center gap-2 border-l-2 px-3 py-2 text-sm transition-colors ${linkClass}`}
                href={item.href}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={`${collapsed ? 'hidden' : 'inline'} flex-1`}>
                  {item.label}
                </span>
                {isItemLocked && !collapsed && (
                  <Lock className="h-3 w-3 shrink-0 text-foreground-muted" />
                )}
              </Link>
            );
          })}

          <div className="mt-4 border-t border-default pt-4">
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              className="flex w-full items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
              type="button"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={`${collapsed ? 'hidden' : 'inline'}`}>
                Logout
              </span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-12 border-b border-default bg-surface-100 px-6">
          <div className="flex h-full items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-wide text-foreground-lighter">
              Alumni dashboard
            </p>
          </div>
        </header>

        <main className="relative flex-1 overflow-auto bg-dash-canvas p-6">
          {children}

          {isCurrentPathLocked && (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-dash-canvas/60">
              <div className="mx-4 w-full max-w-sm rounded-xl border border-amber-500/30 bg-surface-100 p-8 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
                  <Clock className="h-7 w-7 text-amber-400" />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  Account pending approval
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground-light">
                  Your account is being reviewed by an administrator. You will
                  get full access once approved.
                </p>
                <Link
                  href="/profile/edit"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600"
                >
                  <User className="h-4 w-4" />
                  Complete your profile
                </Link>
                <p className="mt-3 text-xs text-foreground-lighter">
                  A complete profile helps speed up the review process.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
