import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchDirectoryAlumniRows,
  resolveDirectoryFilterIds,
  type DirectoryProfile,
  type DirectorySort,
} from '@/lib/alumni/directory-query';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = searchParams.get('q') ?? '';
  const degrees = searchParams.getAll('degree');
  const gradFrom = searchParams.get('grad_from') ?? '';
  const gradTo = searchParams.get('grad_to') ?? '';
  const country = searchParams.get('country') ?? '';
  const skills = searchParams.getAll('skill');
  const sortRaw = searchParams.get('sort') ?? 'relevance';
  const sort: DirectorySort =
    sortRaw === 'name_asc' ||
    sortRaw === 'grad_newest' ||
    sortRaw === 'grad_oldest'
      ? sortRaw
      : 'relevance';

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const filteredProfileIds = await resolveDirectoryFilterIds(supabase, {
    selectedDegrees: degrees,
    gradFrom,
    gradTo,
    selectedSkills: skills,
  });

  if (filteredProfileIds !== null && filteredProfileIds.length === 0) {
    return NextResponse.json({ data: [], total_count: 0, page, total_pages: 0 });
  }

  const { rows, totalCount } = await fetchDirectoryAlumniRows(supabase, {
    q,
    filteredProfileIds,
    country,
    sort,
    page,
    limit,
  });

  const formattedData = rows.map((profile: DirectoryProfile) => {
    const empList = profile.employment_history ?? [];
    const sortedEmp = [...empList].sort(
      (a, b) => new Date(b.start_month).getTime() - new Date(a.start_month).getTime(),
    );
    const currentJob =
      sortedEmp.find((e) => e.end_month === null) ?? sortedEmp[0] ?? null;

    const skillNames = profile.profile_skills
      .map((ps) => {
        const v = ps.skills as { name?: string } | { name?: string }[] | null;
        return Array.isArray(v) ? v[0]?.name : v?.name;
      })
      .filter((n): n is string => Boolean(n));

    return {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      city: profile.city,
      country: profile.country,
      degrees: profile.degrees,
      current_job: currentJob
        ? { job_title: currentJob.job_title, company: currentJob.company }
        : null,
      skills: skillNames,
    };
  });

  return NextResponse.json({
    data: formattedData,
    total_count: totalCount,
    page,
    total_pages: totalCount ? Math.ceil(totalCount / limit) : 0,
  });
}
