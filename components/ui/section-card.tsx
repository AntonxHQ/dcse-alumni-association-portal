import type { ReactNode } from 'react';

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-lg border border-border bg-surface-100 p-5">
      {title ? (
        <header className="mb-4 border-b border-border-muted pb-4">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-foreground-light">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
