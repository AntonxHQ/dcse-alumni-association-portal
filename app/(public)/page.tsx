import Link from 'next/link';

const features = [
  {
    label: 'Alumni Directory',
    body: 'Browse every DCSE graduate by batch, employer, or city. Reconnect with batchmates or find a senior who has walked your path.',
  },
  {
    label: 'Events & Workshops',
    body: 'Department reunions, tech talks, and career fairs — all in one place. Register in seconds, never miss a moment.',
  },
  {
    label: 'Verified Profiles',
    body: 'Your career, your story. Keep your professional profile current and control exactly who sees what.',
  },
];

export default function PublicHomePage() {
  return (
    <div className="relative flex flex-col overflow-hidden">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -5%, hsl(152 60% 53% / 0.16) 0%, transparent 100%)',
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(0 0% 50% / 0.065) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-16 text-center">
        {/* Status pill */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border-secondary bg-surface-100/70 px-3.5 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          <span className="font-mono text-2xs uppercase tracking-widest text-foreground-light">
            DCSE UET Peshawar — 1999 · Till Date
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-2xl text-4xl font-semibold leading-[1.18] tracking-tight text-foreground sm:text-5xl">
          One community.{' '}
          <span
            style={{
              background:
                'linear-gradient(135deg, hsl(152 60% 62%) 0%, hsl(152 60% 44%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Every batch.
          </span>{' '}
          Growing together.
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-foreground-light sm:max-w-md">
          The DCSE Alumni Association brings every graduating batch under one
          roof — to reconnect, support each other, and carry the department's
          legacy forward.
        </p>

        {/* Terminal decoration */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-md border border-border bg-surface-100 px-4 py-2.5">
          <span className="font-mono text-xs text-brand select-none">$</span>
          <span className="font-mono text-xs text-foreground-lighter">
            find /alumni --batch=
            <span className="text-foreground">all</span> --status=
            <span className="text-brand">connected</span>
          </span>
          <span className="h-3.5 w-px animate-pulse bg-brand/70" />
        </div>

        {/* CTAs */}
        <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link
            href="/auth/register"
            className="rounded-full bg-brand px-7 py-2.5 text-sm font-medium text-foreground-contrast transition-opacity hover:opacity-90"
          >
            Create your profile →
          </Link>
          <Link
            href="/auth/login"
            className="rounded-full border border-border-secondary bg-surface-100 px-7 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-200"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature list */}
      <section className="relative z-10 mx-auto w-full max-w-2xl px-6 pb-24">
        <div className="overflow-hidden rounded-xl border border-border-secondary">
          {features.map((f, i) => (
            <div
              key={f.label}
              className={`flex flex-col gap-1.5 bg-surface-100 px-6 py-5 transition-colors hover:bg-surface-200 sm:flex-row sm:items-start sm:gap-8${
                i < features.length - 1 ? ' border-b border-border-secondary' : ''
              }`}
            >
              <span className="min-w-[148px] text-xs font-medium text-foreground">
                {f.label}
              </span>
              <p className="text-xs leading-relaxed text-foreground-light">{f.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-2xs text-foreground-muted">
          Department of Computer Systems Engineering · University of Engineering &amp; Technology, Peshawar
        </p>
      </section>
    </div>
  );
}
