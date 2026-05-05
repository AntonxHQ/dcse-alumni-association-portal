import { NextResponse } from 'next/server';

import { adminClient } from '../../../../lib/supabase/admin';
import { createClient } from '../../../../lib/supabase/server';

const BUCKET = 'dcse-alumni-portal-bucket';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG and PNG files are allowed' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File size must be 10 MB or less' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(path, buffer, { upsert: true, contentType: file.type });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: { publicUrl } } = adminClient.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ url: publicUrl });
}
