import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-default bg-surface-100">
        <div className="flex h-14 max-w-[1280px] mx-auto items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-brand" />
            <span className="text-sm font-medium text-foreground">CSE Alumni</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/events" className="text-sm text-foreground-light transition-colors hover:text-foreground">
              Events
            </Link>
            <Link href="/auth/login" className="text-sm text-foreground-light transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="border-t border-default bg-surface-100">
        <div className="max-w-[1280px] mx-auto px-6 py-6">
          <p className="text-xs text-foreground-lighter">
            © {new Date().getFullYear()} Computer Systems Engineering Department · Alumni Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
