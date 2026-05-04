'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, MessageSquare, User, Users } from 'lucide-react';
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

export default function AlumniLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`flex-shrink-0 border-r border-default bg-dash-sidebar transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'
          }`}
      >
        <div className="flex items-center justify-between border-b border-default px-3 py-3">
          <p
            className={`truncate text-sm font-medium text-foreground transition-opacity ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
          >
            CSE Alumni
          </p>
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-md border border-secondary bg-button p-1.5 text-foreground-light transition-colors hover:text-foreground"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="px-2 py-4">
          {!collapsed ? (
            <p className="mb-2 px-3 text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
              Alumni
            </p>
          ) : null}
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={`mb-1 flex items-center gap-2 border-l-2 px-3 py-2 text-sm transition-colors ${isActive
                    ? 'border-brand bg-surface-300 text-brand'
                    : 'border-transparent text-foreground-light hover:bg-surface-200 hover:text-foreground'
                  }`}
                href={item.href}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={`${collapsed ? 'hidden' : 'inline'}`}>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-4 border-t border-default pt-4">
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              className={`flex w-full items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground`}
              type="button"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={`${collapsed ? 'hidden' : 'inline'}`}>Logout</span>
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
        <main className="flex-1 overflow-auto bg-dash-canvas p-6">{children}</main>
      </div>
    </div>
  );
}
