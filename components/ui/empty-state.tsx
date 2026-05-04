import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: ReactNode;
};

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-100 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-foreground-lighter">
        {icon}
      </div>
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-foreground-light">{description}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}
