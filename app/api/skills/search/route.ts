import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const supabase = await createClient();

  let query = supabase.from('skills').select('name').order('name').limit(10);
  if (q) {
    query = query.ilike('name', `${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => row.name as string),
  });
}
