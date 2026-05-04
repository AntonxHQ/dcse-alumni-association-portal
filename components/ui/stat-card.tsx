import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: 'positive' | 'negative';
  icon?: ReactNode;
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = 'positive',
  icon,
}: StatCardProps) {
  const deltaColor =
    deltaTone === 'negative' ? 'text-destructive' : 'text-brand';

  return (
    <article className="rounded-lg border border-border bg-surface-100 p-5 transition-colors duration-150 hover:border-border-secondary">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-mono tracking-wide text-foreground-lighter">
          {label}
        </p>
        {icon ? <div className="text-foreground-lighter">{icon}</div> : null}
      </div>
      <p className="mt-2 text-2xl font-medium text-foreground">{value}</p>
      {delta ? <p className={`mt-1 text-xs ${deltaColor}`}>{delta}</p> : null}
    </article>
  );
}
