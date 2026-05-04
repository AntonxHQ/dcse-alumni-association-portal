import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '../../../../../lib/supabase/server';
import { adminClient } from '../../../../../lib/supabase/admin';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRole } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!adminRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: alumni, error } = await adminClient
    .from('profiles')
    .select('id, full_name, email, status, phone, city, country, avatar_url, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ['id', 'full_name', 'email', 'status', 'phone', 'city', 'country', 'avatar_url', 'created_at'];
  const rows = (alumni ?? []).map((a) =>
    headers.map((h) => {
      const val = a[h as keyof typeof a] ?? '';
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');

  // Audit log
  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'alumni.exported',
    target_type: 'system',
    target_id: 'csv-export',
    metadata: { count: (alumni ?? []).length },
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="alumni-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
