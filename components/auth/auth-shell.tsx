import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
};

export function AuthShell({ title, subtitle, children, wide }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section
        className={`w-full rounded-lg border border-border bg-surface-100 p-8 ${wide ? 'max-w-[540px]' : 'max-w-[400px]'
          }`}
      >
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-brand text-xs font-bold text-foreground-contrast select-none">D</span>
          <p className="text-base font-medium text-foreground">DCSE Alumni Association</p>
        </div>
        <h1 className="text-lg font-medium text-foreground">{title}</h1>
        {subtitle ? <p className="mb-6 mt-1 text-sm text-foreground-light">{subtitle}</p> : null}
        {children}
      </section>
    </main>
  );
}
