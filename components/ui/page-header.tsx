import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  cta?: ReactNode;
};

export function PageHeader({ title, description, cta }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-medium text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-foreground-light">{description}</p>
        ) : null}
      </div>
      {cta ? <div>{cta}</div> : null}
    </header>
  );
}
