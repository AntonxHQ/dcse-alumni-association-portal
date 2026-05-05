import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, Users } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAnonSupabaseServer } from '@/lib/supabase/anon-server';
import {
  fetchDirectoryAlumniRows,
  resolveDirectoryFilterIds,
  type DirectoryProfile,
  type DirectorySort,
} from '@/lib/alumni/directory-query';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { AnalyticsBanner } from '@/components/alumni/analytics-banner';
import { AlumniCard } from '@/components/alumni/alumni-card';
import { DirectoryFilters } from '@/components/alumni/directory-filters';

export const revalidate = 300;

type SearchParams = Promise<{
  q?: string;
  degree?: string | string[];
  grad_from?: string;
  grad_to?: string;
  country?: string;
  skill?: string | string[];
  sort?: string;
  page?: string;
}>;

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function buildPaginationUrl(
  base: {
    q: string;
    degrees: string[];
    gradFrom: string;
    gradTo: string;
    country: string;
    skills: string[];
    sort: string;
  },
  targetPage: number,
): string {
  const params = new URLSearchParams();
  if (base.q) params.set('q', base.q);
  base.degrees.forEach((d) => params.append('degree', d));
  if (base.gradFrom) params.set('grad_from', base.gradFrom);
  if (base.gradTo) params.set('grad_to', base.gradTo);
  if (base.country) params.set('country', base.country);
  base.skills.forEach((s) => params.append('skill', s));
  if (base.sort && base.sort !== 'relevance') params.set('sort', base.sort);
  params.set('page', String(targetPage));
  return `/alumni?${params.toString()}`;
}

type AlumniDirectoryPageProps = {
  searchParams: SearchParams;
};

export default async function AlumniDirectoryPage(props: AlumniDirectoryPageProps) {
  const query = await props.searchParams;
  const supabase = await createClient();
  const anon = createAnonSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/alumni');
  }

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle();
  const viewerStatus = (viewerProfile?.status as string | null) ?? null;

  const q = query.q ?? '';
  const selectedDegrees = toArray(query.degree);
  const gradFrom = query.grad_from ?? '';
  const gradTo = query.grad_to ?? '';
  const country = query.country ?? '';
  const selectedSkills = toArray(query.skill);
  const sortRaw = query.sort ?? 'relevance';
  const sort: DirectorySort =
    sortRaw === 'name_asc' ||
    sortRaw === 'grad_newest' ||
    sortRaw === 'grad_oldest'
      ? sortRaw
      : 'relevance';
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10));
  const LIMIT = 20;

  const filteredProfileIds = await resolveDirectoryFilterIds(supabase, {
    selectedDegrees,
    gradFrom,
    gradTo,
    selectedSkills,
  });

  const currentYear = new Date().getFullYear();

  const filteredIdsForRpc =
    filteredProfileIds !== null && filteredProfileIds.length === 0
      ? 'empty'
      : 'run';

  const [
    totalAlumniResp,
    countryRowsResp,
    allDegreeRowsResp,
    employedRowsResp,
    internationalCountResp,
    newThisYearCountResp,
    abroadCountryRowsResp,
    allSkillRowsResp,
    allSkillsDefsResp,
    directoryResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabase.from('profiles').select('country').eq('status', 'active'),

    supabase.from('degrees').select('level, graduation_year'),

    supabase
      .from('employment_history')
      .select('profile_id')
      .is('end_month', null),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('country', 'is', null)
      .neq('country', 'PK'),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', `${currentYear}-01-01T00:00:00.000Z`),

    supabase
      .from('profiles')
      .select('country')
      .eq('status', 'active')
      .not('country', 'is', null)
      .neq('country', 'PK'),

    supabase.from('profile_skills').select('profile_id, skills(name)'),

    anon.from('skills').select('name').order('name'),

    filteredIdsForRpc === 'empty'
      ? Promise.resolve({ rows: [] as DirectoryProfile[], totalCount: 0 })
      : fetchDirectoryAlumniRows(supabase, {
          q,
          filteredProfileIds,
          country,
          sort,
          page,
          limit: LIMIT,
        }),
  ]);

  const countryRows = countryRowsResp.data;

  const uniqueCountries = new Set(
    (countryRows ?? [])
      .map((r: { country: string | null }) => r.country)
      .filter(Boolean),
  ).size;

  const countriesAbroadDistinct = new Set(
    (abroadCountryRowsResp.data ?? [])
      .map((r: { country: string }) => r.country)
      .filter(Boolean),
  ).size;

  const degreeCounts: Record<string, number> = { BS: 0, MS: 0, PhD: 0 };
  const gradYears: number[] = [];

  const allDegreeRows = allDegreeRowsResp.data ?? [];

  for (const row of allDegreeRows) {
    const lvl = (row as { level: string }).level;
    if (lvl in degreeCounts) degreeCounts[lvl]++;
    const gy = (row as { graduation_year: number }).graduation_year;
    if (typeof gy === 'number') gradYears.push(gy);
  }

  let classYearsSpan: string | null = null;
  if (gradYears.length > 0) {
    classYearsSpan = `${Math.min(...gradYears)} – ${Math.max(...gradYears)}`;
  }

  const topDegreeLevel = (
    ['BS', 'MS', 'PhD'] as const
  ).reduce<[string | null, number]>((best, lvl) => {
    const [bL, bC] = best;
    const c = degreeCounts[lvl] ?? 0;
    if (c > bC) return [lvl, c];
    return [bL, bC];
  }, [null, 0])[0];

  const skillFreq: Record<string, number> = {};
  for (const row of allSkillRowsResp.data ?? []) {
    const skillObj = (
      row as { skills: { name?: string } | { name?: string }[] | null }
    ).skills;
    const name = Array.isArray(skillObj) ? skillObj[0]?.name : skillObj?.name;
    if (name) skillFreq[name] = (skillFreq[name] ?? 0) + 1;
  }
  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const employedRows = employedRowsResp.data;

  const employedCount = new Set(
    (employedRows ?? []).map((r: { profile_id: string }) => r.profile_id),
  ).size;

  const alumni = directoryResult.rows.map((p: DirectoryProfile) => {
    const sortedEmp = [...p.employment_history].sort(
      (a, b) =>
        new Date(b.start_month).getTime() -
        new Date(a.start_month).getTime(),
    );
    const currentJob =
      sortedEmp.find((e) => !e.end_month) ?? sortedEmp[0] ?? null;

    const skills = p.profile_skills
      .map((ps) => (ps.skills as { name?: string } | null)?.name)
      .filter((n): n is string => Boolean(n));

    return {
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      city: p.city,
      country: p.country,
      current_job: currentJob
        ? { job_title: currentJob.job_title, company: currentJob.company }
        : null,
      degrees: p.degrees,
      skills,
    };
  });

  const totalCount = directoryResult.totalCount;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const offset = (page - 1) * LIMIT;

  const paginationBase = {
    q,
    degrees: selectedDegrees,
    gradFrom,
    gradTo,
    country,
    skills: selectedSkills,
    sort,
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {viewerStatus && viewerStatus !== 'active' && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {viewerStatus === 'pending_email'
                ? 'Email not verified'
                : 'Account pending approval'}
            </p>
            <p className="mt-0.5 text-xs text-foreground-light">
              {viewerStatus === 'pending_email'
                ? 'Please verify your email to complete registration.'
                : 'An admin will review and approve your account. You can browse the directory once approved.'}
            </p>
          </div>
        </div>
      )}

      <PageHeader
        title="Alumni Directory"
        description="Connect with fellow CSE graduates."
      />

      <AnalyticsBanner
        totalAlumni={totalAlumniResp.count ?? 0}
        countries={uniqueCountries}
        employed={employedCount}
        newThisYear={newThisYearCountResp.count ?? 0}
        topSkills={topSkills}
        degreeCounts={{
          BS: degreeCounts.BS ?? 0,
          MS: degreeCounts.MS ?? 0,
          PhD: degreeCounts.PhD ?? 0,
        }}
        international={internationalCountResp.count ?? 0}
        countriesAbroadDistinct={countriesAbroadDistinct}
        classYearsSpan={classYearsSpan}
        topDegreeLevel={topDegreeLevel}
      />

      <DirectoryFilters
        q={q}
        selectedDegrees={selectedDegrees}
        gradFrom={gradFrom}
        gradTo={gradTo}
        country={country}
        selectedSkills={selectedSkills}
        sort={sort}
        allSkills={(allSkillsDefsResp.data ?? []).map(
          (s: { name: string }) => s.name,
        )}
      />

      <p className="mb-4 text-xs text-foreground-lighter">
        {totalCount.toLocaleString()}{' '}
        {totalCount === 1 ? 'alumnus' : 'alumni'} found
      </p>

      {alumni.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="No alumni found"
          description={
            q ||
            selectedDegrees.length > 0 ||
            gradFrom ||
            gradTo ||
            country ||
            selectedSkills.length > 0
              ? 'Try adjusting your search or filters.'
              : 'The directory shows only alumni with status active. Pending email or pending admin accounts still exist as rows in the database but are excluded from this list.'
          }
          cta={
            q ||
            selectedDegrees.length > 0 ||
            gradFrom ||
            gradTo ||
            country ||
            selectedSkills.length > 0 ? (
              <Link
                href="/alumni"
                className="inline-flex rounded-md border border-border-secondary bg-button px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-300"
              >
                Clear filters
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {alumni.map((a) => (
            <AlumniCard key={a.id} alumni={a} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between border-t border-muted pt-4">
          <span className="text-sm text-foreground-lighter">
            Showing {offset + 1}–{Math.min(offset + LIMIT, totalCount)} of{' '}
            {totalCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link
                href={buildPaginationUrl(paginationBase, page - 1)}
                className="rounded-md px-2.5 py-1.5 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
              >
                ←
              </Link>
            ) : null}

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Link
                  key={pageNum}
                  href={buildPaginationUrl(paginationBase, pageNum)}
                  className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    pageNum === page
                      ? 'bg-surface-300 font-medium text-foreground'
                      : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}

            {page < totalPages ? (
              <Link
                href={buildPaginationUrl(paginationBase, page + 1)}
                className="rounded-md px-2.5 py-1.5 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
              >
                →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
