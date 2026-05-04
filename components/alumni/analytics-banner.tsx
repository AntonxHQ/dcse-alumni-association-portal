import { Globe } from 'lucide-react';

type AnalyticsBannerProps = {
  totalAlumni: number;
  countries: number;
  employed: number;
  newThisYear: number;
  topSkills: { name: string; count: number }[];
  degreeCounts: { BS: number; MS: number; PhD: number };
  international: number;
  /** DISTINCT countries represented among alumni outside Pakistan */
  countriesAbroadDistinct: number;
  /** §4.1 graduation year span, e.g. "2018 – 2024" */
  classYearsSpan: string | null;
  /** Winning degree level label, e.g. "BS" */
  topDegreeLevel: string | null;
};

export function AnalyticsBanner({
  totalAlumni,
  countries,
  employed,
  newThisYear,
  topSkills,
  degreeCounts,
  international,
  countriesAbroadDistinct,
  classYearsSpan,
  topDegreeLevel,
}: AnalyticsBannerProps) {
  return (
    <div className="mb-6 rounded-lg border border-default bg-surface-100 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-foreground-lighter">
          Community overview
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-foreground-muted">
            Live · updates every 5 min
          </span>
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <StatCell formatAsNumber value={totalAlumni} label="Alumni registered" />
        <StatCell formatAsNumber value={countries} label="Countries" />
        <StatCell formatAsNumber value={employed} label="Currently employed" />
        <StatCell
          formatAsNumber
          value={newThisYear}
          label="Joined this year"
          extra={<span className="mt-0.5 block text-[11px] text-brand">↑ this year</span>}
        />
      </div>

      {/* §4.1: Class years + Top degree */}
      <div className="mt-px grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <StatCell
          value={classYearsSpan ?? '—'}
          label="Class years"
        />
        <StatCell
          value={topDegreeLevel ?? '—'}
          label="Top degree"
        />
      </div>

      <div className="mt-1 border-t border-muted pt-4">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground-lighter">
              Top skills
            </p>
            {topSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map((skill, i) => (
                  <span
                    key={skill.name}
                    className={
                      i === 0
                        ? 'rounded border border-brand/20 bg-brand/10 px-2 py-0.5 text-[11px] text-brand'
                        : 'rounded bg-surface-300 px-2 py-0.5 text-[11px] text-foreground-light'
                    }
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground-lighter">No skills data yet.</p>
            )}
          </div>

          <div className="w-44 shrink-0">
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-foreground-lighter">
              Degrees
            </p>
            {(['BS', 'MS', 'PhD'] as const).map((level) => {
              const count = degreeCounts[level];
              const pct =
                totalAlumni > 0 ? (count / totalAlumni) * 100 : 0;
              return (
                <div key={level} className="mb-1.5 flex items-center gap-2">
                  <span className="w-8 text-[11px] font-medium text-foreground-light">
                    {level}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-300">
                    <div
                      className="h-1.5 rounded-full bg-brand transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] text-foreground-lighter">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-muted pt-3">
          <Globe className="h-3.5 w-3.5 shrink-0 text-foreground-lighter" />
          <p className="text-xs text-foreground-light">
            <span className="font-medium text-brand">{international}</span> alumni in{' '}
            <span className="font-medium text-brand">{countriesAbroadDistinct}</span>{' '}
            countries outside Pakistan
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  value,
  label,
  extra,
  formatAsNumber = false,
}: {
  value: number | string;
  label: string;
  extra?: React.ReactNode;
  formatAsNumber?: boolean;
}) {
  const display =
    formatAsNumber && typeof value === 'number'
      ? value.toLocaleString()
      : String(value);
  return (
    <div className="bg-surface-100 px-4 py-3">
      <p className="text-xl font-medium text-foreground">{display}</p>
      <p className="mt-0.5 text-xs text-foreground-lighter">{label}</p>
      {extra}
    </div>
  );
}
