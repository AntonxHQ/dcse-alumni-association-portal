'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '../../../../lib/supabase/server';

const privacySchema = z.object({
  email: z.enum(['alumni_only', 'private']),
  phone: z.enum(['alumni_only', 'private']),
  postal_address: z.enum(['alumni_only', 'private']),
  city: z.enum(['alumni_only', 'private']),
  employment: z.enum(['alumni_only', 'private']),
});

const employmentSchema = z.object({
  job_title: z.string().trim().min(1).max(100),
  company: z.string().trim().min(1).max(100),
  employment_type: z
    .enum(['full_time', 'part_time', 'contract', 'freelance', 'internship', 'self_employed'])
    .nullable(),
  start_month: z.string().regex(/^\d{4}-\d{2}$/),
  end_month: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  city: z.string().trim().max(100).nullable(),
  country: z.string().trim().length(2).nullable(),
  description: z.string().trim().max(300).nullable(),
});

function toMonthDate(month: string | null) {
  if (!month) return null;
  return `${month}-01`;
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function saveAvatarUrl(url: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function saveProfileBasics(input: {
  full_name: string;
  phone: string;
  city: string;
  country: string;
  postal_address: string;
  bio: string;
}) {
  const { supabase, user } = await requireUser();
  await supabase
    .from('profiles')
    .update({
      full_name: input.full_name.trim(),
      phone: input.phone.trim() || null,
      city: input.city.trim() || null,
      country: input.country.trim().toUpperCase() || null,
      postal_address: input.postal_address.trim() || null,
      bio: input.bio.trim() || null,
    })
    .eq('id', user.id);
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function saveDegrees(input: {
  selectedLevels: Array<'BS' | 'MS' | 'PhD'>;
  values: Partial<Record<'BS' | 'MS' | 'PhD', { registration_no: string; batch_no?: number }>>;
}) {
  const { supabase, user } = await requireUser();

  for (const level of input.selectedLevels) {
    const dv = input.values[level];
    if (!dv?.registration_no?.trim()) throw new Error(`Registration number required for ${level}`);

    const intakeYear = dv.batch_no ? 1998 + dv.batch_no : 0;
    const graduationYear = intakeYear; // satisfies DB check graduation_year >= intake_year

    await supabase.from('degrees').upsert(
      { profile_id: user.id, level, registration_no: dv.registration_no.trim(), intake_year: intakeYear, graduation_year: graduationYear },
      { onConflict: 'profile_id,level' },
    );
  }

  const toDelete = ['BS', 'MS', 'PhD'].filter(
    (l) => !input.selectedLevels.includes(l as 'BS' | 'MS' | 'PhD'),
  );
  if (toDelete.length > 0) {
    await supabase.from('degrees').delete().eq('profile_id', user.id).in('level', toDelete);
  }

  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function saveEmployment(entries: Array<{
  id?: string;
  job_title: string;
  company: string;
  employment_type: string;
  start_month: string;
  end_month: string;
}>) {
  const { supabase, user } = await requireUser();

  // Replace all employment entries
  await supabase.from('employment_history').delete().eq('profile_id', user.id);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e.job_title?.trim() || !e.company?.trim()) continue;
    await supabase.from('employment_history').insert({
      profile_id: user.id,
      job_title: e.job_title.trim(),
      company: e.company.trim(),
      employment_type: e.employment_type || null,
      start_month: e.start_month ? `${e.start_month}-01` : null,
      end_month: e.end_month ? `${e.end_month}-01` : null,
      sort_order: i,
    });
  }

  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function createEmployment(input: z.infer<typeof employmentSchema>) {
  const { supabase, user } = await requireUser();
  const parsed = employmentSchema.parse(input);
  await supabase.from('employment_history').insert({
    profile_id: user.id,
    ...parsed,
    start_month: toMonthDate(parsed.start_month),
    end_month: toMonthDate(parsed.end_month),
  });
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function deleteEmployment(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('employment_history').delete().eq('id', id).eq('profile_id', user.id);
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function saveAchievements(achievements: Array<{
  title: string;
  year?: number;
  description?: string;
}>) {
  const { supabase, user } = await requireUser();

  await supabase.from('career_highlights').delete().eq('profile_id', user.id);

  for (let i = 0; i < achievements.length; i++) {
    const a = achievements[i];
    if (!a.title?.trim()) continue;
    await supabase.from('career_highlights').insert({
      profile_id: user.id,
      title: a.title.trim(),
      year: a.year || null,
      description: a.description?.trim() || null,
      sort_order: i,
    });
  }

  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function saveSkills(skillNames: string[]) {
  const { supabase, user } = await requireUser();
  const normalized = Array.from(new Set(skillNames.map((n) => n.trim()).filter(Boolean))).slice(0, 20);

  const skillIds: string[] = [];
  for (const name of normalized) {
    const { data: existing } = await supabase.from('skills').select('id').ilike('name', name).maybeSingle();
    if (existing?.id) { skillIds.push(existing.id); continue; }
    const { data: created } = await supabase.from('skills').insert({ name, is_predefined: false }).select('id').single();
    if (created?.id) skillIds.push(created.id);
  }

  await supabase.from('profile_skills').delete().eq('profile_id', user.id);
  if (skillIds.length > 0) {
    await supabase.from('profile_skills').insert(skillIds.map((skill_id) => ({ profile_id: user.id, skill_id })));
  }

  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function savePrivacySettings(values: z.infer<typeof privacySchema>) {
  const { supabase, user } = await requireUser();
  const parsed = privacySchema.parse(values);
  await supabase.from('profiles').update({ privacy_settings: parsed }).eq('id', user.id);
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}
