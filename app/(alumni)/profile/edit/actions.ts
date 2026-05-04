'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '../../../../lib/supabase/server';

const privacySchema = z.object({
  email: z.enum(['alumni_only', 'private']),
  phone: z.enum(['alumni_only', 'private']),
  postal_address: z.enum(['alumni_only', 'private']),
  city: z.enum(['public', 'alumni_only', 'private']),
  employment: z.enum(['public', 'alumni_only']),
});

const employmentSchema = z.object({
  job_title: z.string().trim().min(1).max(100),
  company: z.string().trim().min(1).max(100),
  employment_type: z
    .enum([
      'full_time',
      'part_time',
      'contract',
      'freelance',
      'internship',
      'self_employed',
    ])
    .nullable(),
  start_month: z.string().regex(/^\d{4}-\d{2}$/),
  end_month: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  city: z.string().trim().max(100).nullable(),
  country: z.string().trim().length(2).nullable(),
  description: z.string().trim().max(300).nullable(),
});

const degreeValueSchema = z.object({
  registration_no: z.string().trim().min(1).max(50),
  intake_year: z.coerce.number().int().min(1980).max(new Date().getFullYear()),
  graduation_year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 10),
});

function toMonthDate(month: string | null) {
  if (!month) return null;
  return `${month}-01`;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

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
  values: Partial<
    Record<'BS' | 'MS' | 'PhD', { registration_no: string; intake_year: number; graduation_year: number }>
  >;
}) {
  const { supabase, user } = await requireUser();
  const registrationRegex = process.env.DEGREE_REGISTRATION_REGEX;

  for (const level of input.selectedLevels) {
    const parsed = degreeValueSchema.safeParse(input.values[level]);
    if (!parsed.success) {
      throw new Error('Invalid degree fields');
    }
    if (parsed.data.graduation_year < parsed.data.intake_year) {
      throw new Error('Graduation year must be after intake year');
    }
    if (registrationRegex && !new RegExp(registrationRegex).test(parsed.data.registration_no)) {
      throw new Error('Invalid registration number format');
    }
    await supabase.from('degrees').upsert(
      {
        profile_id: user.id,
        level,
        ...parsed.data,
      },
      { onConflict: 'profile_id,level' },
    );
  }

  const levelsToDelete = ['BS', 'MS', 'PhD'].filter(
    (level) => !input.selectedLevels.includes(level as 'BS' | 'MS' | 'PhD'),
  );
  if (levelsToDelete.length > 0) {
    await supabase
      .from('degrees')
      .delete()
      .eq('profile_id', user.id)
      .in('level', levelsToDelete);
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

export async function updateEmployment(id: string, input: z.infer<typeof employmentSchema>) {
  const { supabase, user } = await requireUser();
  const parsed = employmentSchema.parse(input);
  await supabase
    .from('employment_history')
    .update({
      ...parsed,
      start_month: toMonthDate(parsed.start_month),
      end_month: toMonthDate(parsed.end_month),
    })
    .eq('id', id)
    .eq('profile_id', user.id);
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function deleteEmployment(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('employment_history').delete().eq('id', id).eq('profile_id', user.id);
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function saveSkills(skillNames: string[]) {
  const { supabase, user } = await requireUser();
  const normalized = Array.from(
    new Set(skillNames.map((name) => name.trim()).filter(Boolean)),
  ).slice(0, 20);

  const skillIds: string[] = [];
  for (const name of normalized) {
    const { data: existing } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', name)
      .maybeSingle();
    if (existing?.id) {
      skillIds.push(existing.id);
      continue;
    }
    const { data: created } = await supabase
      .from('skills')
      .insert({ name, is_predefined: false })
      .select('id')
      .single();
    if (created?.id) {
      skillIds.push(created.id);
    }
  }

  await supabase.from('profile_skills').delete().eq('profile_id', user.id);
  if (skillIds.length > 0) {
    await supabase.from('profile_skills').insert(
      skillIds.map((skillId) => ({
        profile_id: user.id,
        skill_id: skillId,
      })),
    );
  }
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}

export async function savePrivacySettings(values: z.infer<typeof privacySchema>) {
  const { supabase, user } = await requireUser();
  const parsed = privacySchema.parse(values);
  await supabase
    .from('profiles')
    .update({
      privacy_settings: parsed,
    })
    .eq('id', user.id);
  revalidatePath('/profile/edit');
  revalidatePath(`/alumni/${user.id}`);
}
