/**
 * Seeds a super_admin account for testing.
 * Run: npx tsx scripts/seed-admin.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ADMIN_EMAIL = 'admin@cse-alumni.test';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'Portal Admin';

async function api(path: string, body: unknown, method = 'POST') {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function postgrestApi(path: string, body: unknown, method = 'POST') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log('🌱 Seeding admin account…\n');

  // 1. Create auth user (or find existing)
  let userId: string;

  // Try to list existing users to find by email
  const listRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=100`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const listData = await listRes.json();
  const existing = listData.users?.find((u: { email: string }) => u.email === ADMIN_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log(`✓ Auth user already exists: ${userId}`);

    // Update password in case it changed
    await api(`/auth/v1/admin/users/${userId}`, { password: ADMIN_PASSWORD }, 'PUT');
    console.log('✓ Password updated');
  } else {
    // Create new auth user (email already confirmed)
    const user = await api('/auth/v1/admin/users', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    userId = user.id;
    console.log(`✓ Auth user created: ${userId}`);
  }

  // 2. Upsert profile
  await postgrestApi(
    `/profiles?id=eq.${userId}`,
    {
      id: userId,
      full_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      status: 'active',
    },
    'PATCH'
  ).catch(() => null); // may 404 if not exists yet

  // Try insert if patch found nothing
  await postgrestApi('/profiles', {
    id: userId,
    full_name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    status: 'active',
  }).catch(() => null); // ignore duplicate key

  console.log('✓ Profile upserted');

  // 3. Upsert admin_roles
  await postgrestApi(
    `/admin_roles?profile_id=eq.${userId}&role=eq.super_admin`,
    { profile_id: userId, role: 'super_admin', granted_by: userId },
    'PATCH'
  ).catch(() => null);

  await postgrestApi('/admin_roles', {
    profile_id: userId,
    role: 'super_admin',
    granted_by: userId,
  }).catch(() => null); // ignore duplicate key

  console.log('✓ super_admin role granted\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin account ready:');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('  URL:      http://localhost:3000/auth/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
