import type { SupabaseClient } from '@supabase/supabase-js';

export type DirectorySort =
  | 'relevance'
  | 'name_asc'
  | 'grad_newest'
  | 'grad_oldest';

export type DirectoryProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  employment_history: {
    job_title: string;
    company: string;
    start_month: string;
    end_month: string | null;
  }[];
  profile_skills: { skills: { name?: string } | null }[];
  degrees: { level: string; graduation_year: number }[];
};

export async function resolveDirectoryFilterIds(
  supabase: SupabaseClient,
  options: {
    selectedDegrees: string[];
    gradFrom: string;
    gradTo: string;
    selectedSkills: string[];
  },
): Promise<string[] | null> {
  const { selectedDegrees, gradFrom, gradTo, selectedSkills } = options;

  let degreeFilterIds: string[] | null = null;
  let skillFilterIds: string[] | null = null;

  if (selectedDegrees.length > 0 || gradFrom || gradTo) {
    let degreeQuery = supabase.from('degrees').select('profile_id');
    if (selectedDegrees.length > 0) {
      degreeQuery = degreeQuery.in('level', selectedDegrees);
    }
    if (gradFrom) {
      degreeQuery = degreeQuery.gte('graduation_year', parseInt(gradFrom, 10));
    }
    if (gradTo) {
      degreeQuery = degreeQuery.lte('graduation_year', parseInt(gradTo, 10));
    }
    const { data: degreeRows } = await degreeQuery;
    degreeFilterIds = [
      ...new Set(
        (degreeRows ?? []).map((r: { profile_id: string }) => r.profile_id),
      ),
    ];
  }

  if (selectedSkills.length > 0) {
    const { data: skillDefs } = await supabase
      .from('skills')
      .select('id')
      .in('name', selectedSkills);
    const skillIds = (skillDefs ?? []).map((r: { id: string }) => r.id);
    if (skillIds.length > 0) {
      const { data: psRows } = await supabase
        .from('profile_skills')
        .select('profile_id')
        .in('skill_id', skillIds);
      skillFilterIds = [
        ...new Set(
          (psRows ?? []).map((r: { profile_id: string }) => r.profile_id),
        ),
      ];
    } else {
      skillFilterIds = [];
    }
  }

  let filteredProfileIds: string[] | null = null;
  if (degreeFilterIds !== null && skillFilterIds !== null) {
    const sf = skillFilterIds;
    filteredProfileIds = degreeFilterIds.filter((id) => sf.includes(id));
  } else if (degreeFilterIds !== null) {
    filteredProfileIds = degreeFilterIds;
  } else if (skillFilterIds !== null) {
    filteredProfileIds = skillFilterIds;
  }
  return filteredProfileIds;
}

type RpcRow = { profile_id: string; total_count: number };

/**
 * Sorted, paginated directory rows via Postgres RPC (`directory_search_profile_ids`).
 */
export async function fetchDirectoryAlumniRows(
  supabase: SupabaseClient,
  options: {
    q: string;
    filteredProfileIds: string[] | null;
    country: string;
    sort: DirectorySort;
    page: number;
    limit?: number;
  },
): Promise<{ rows: DirectoryProfile[]; totalCount: number }> {
  const { q, filteredProfileIds, country, sort, page, limit = 20 } = options;

  const offset = (Math.max(1, page) - 1) * limit;
  const searchText = q.trim() === '' ? null : q.trim();

  const rpcArgs = {
    p_search: searchText,
    p_profile_ids:
      filteredProfileIds !== null && filteredProfileIds.length > 0
        ? filteredProfileIds
        : null,
    p_country: country.trim() === '' ? null : country.trim(),
    p_sort: sort,
    p_limit: limit,
    p_offset: offset,
  };

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'directory_search_profile_ids',
    rpcArgs as never,
  );

  if (rpcError) {
    console.error('directory_search_profile_ids RPC:', rpcError);
    return { rows: [], totalCount: 0 };
  }

  const idsRows = (rpcData ?? []) as RpcRow[];
  const totalCount = idsRows.length > 0 ? Number(idsRows[0].total_count) : 0;
  const orderedIds = idsRows.map((r) => r.profile_id).filter(Boolean);
  if (orderedIds.length === 0) {
    return { rows: [], totalCount };
  }

  const { data: rawRows, error: fetchErr } = await supabase
    .from('profiles')
    .select(
      `
        id, full_name, avatar_url, city, country,
        degrees ( level, graduation_year ),
        employment_history ( job_title, company, start_month, end_month ),
        profile_skills ( skills ( name ) )
      `,
    )
    .in('id', orderedIds);

  if (fetchErr) {
    console.error('directory profile hydrate:', fetchErr);
    return { rows: [], totalCount };
  }

  const byId = new Map(
    (rawRows ?? []).map((row) => [(row as { id: string }).id, row]),
  );

  const rows = orderedIds
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((p) => p as DirectoryProfile);

  return { rows, totalCount };
}
