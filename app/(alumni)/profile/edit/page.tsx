import { redirect } from 'next/navigation';

import { createClient } from '../../../../lib/supabase/server';
import { ProfileEditClient } from './profile-edit-client';

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/profile/edit');

  const [{ data: profile }, { data: degrees }, { data: employment }, { data: skillRows }, { data: highlights }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('degrees').select('*').eq('profile_id', user.id),
      supabase.from('employment_history').select('*').eq('profile_id', user.id).order('sort_order', { ascending: true }).order('start_month', { ascending: false }),
      supabase.from('profile_skills').select('skills(name)').eq('profile_id', user.id),
      supabase.from('career_highlights').select('*').eq('profile_id', user.id).order('sort_order', { ascending: true }),
    ]);

  return (
    <ProfileEditClient
      initial={{
        id: user.id,
        full_name: profile?.full_name ?? '',
        avatar_url: profile?.avatar_url ?? null,
        email: profile?.email ?? '',
        phone: profile?.phone ?? null,
        city: profile?.city ?? null,
        country: profile?.country ?? null,
        postal_address: profile?.postal_address ?? null,
        bio: profile?.bio ?? null,
        privacy_settings: (profile?.privacy_settings as Record<string, string> | null) ?? null,
        degrees: degrees?.map((d) => ({
          level: d.level as 'BS' | 'MS' | 'PhD',
          registration_no: d.registration_no as string,
          intake_year: d.intake_year as number | null,
        })) ?? [],
        employment: employment?.map((item) => ({
          id: item.id as string,
          job_title: item.job_title as string,
          company: item.company as string,
          employment_type: (item.employment_type as string | null) ?? '',
          start_month: (item.start_month as string).slice(0, 7),
          end_month: (item.end_month as string | null)?.slice(0, 7) ?? '',
        })) ?? [],
        skills: skillRows?.map((row) => {
          const value = row.skills as { name?: string } | null;
          return value?.name ?? null;
        }).filter((n): n is string => Boolean(n)) ?? [],
        achievements: highlights?.map((h) => ({
          title: h.title as string,
          year: (h.year as number | null) ?? undefined,
          description: (h.description as string | null) ?? undefined,
        })) ?? [],
      }}
    />
  );
}
