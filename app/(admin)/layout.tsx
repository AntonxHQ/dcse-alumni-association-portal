'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Calendar,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import type { ReactNode } from 'react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/alumni', label: 'Alumni', icon: Users },
      { href: '/admin/events', label: 'Events', icon: Calendar },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 border-r border-default bg-dash-sidebar transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default px-3 py-3">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-brand" />
              <span className="truncate text-sm font-medium text-foreground">CSE Alumni</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto rounded-md border border-border-secondary bg-button p-1.5 text-foreground-light transition-colors hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 py-3 flex flex-col h-[calc(100%-49px)]">
          <div className="flex-1 space-y-0.5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-1 mt-5 px-3 text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? 'border-brand bg-surface-300 text-brand'
                          : 'border-transparent text-foreground-light hover:bg-surface-200 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-default pt-3">
            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              className="flex w-full items-center gap-2 rounded-md border-l-2 border-transparent px-3 py-2 text-[13px] text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-12 border-b border-default bg-surface-100 px-6">
          <div className="flex h-full items-center">
            <p className="text-[13px] text-foreground-light">
              <Link href="/admin" className="hover:text-foreground">Admin</Link>
              {pathname !== '/admin' && (
                <>
                  <span className="mx-1 text-foreground-muted">/</span>
                  <span className="text-foreground capitalize">
                    {pathname.split('/admin/')[1]?.split('/')[0] ?? ''}
                  </span>
                </>
              )}
            </p>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-dash-canvas p-6">{children}</main>
      </div>
    </div>
  );
}
