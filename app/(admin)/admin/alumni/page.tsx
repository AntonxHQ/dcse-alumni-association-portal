import { adminClient } from '../../../../lib/supabase/admin';
import { createClient as createServerClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlumniTable } from './alumni-table';

const PAGE_SIZE = 20;

export default async function AdminAlumniPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!adminRole) redirect('/dashboard');

  const params = await searchParams;
  const q = params.q ?? '';
  const status = params.status ?? '';
  const page = parseInt(params.page ?? '1', 10);

  let query = adminClient
    .from('profiles')
    .select('id, full_name, email, status, created_at, updated_at, degrees(level, graduation_year)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status) query = query.eq('status', status);
  if (q) query = query.ilike('full_name', `%${q}%`);

  const { data: alumni, count } = await query;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-foreground">Alumni</h1>
      <AlumniTable
        alumni={(alumni ?? []) as Parameters<typeof AlumniTable>[0]['alumni']}
        total={total}
        page={page}
        totalPages={totalPages}
        statusFilter={status}
      />
    </div>
  );
}
