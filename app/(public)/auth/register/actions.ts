'use server';

import { createClient } from '../../../../lib/supabase/server';
import { adminClient } from '../../../../lib/supabase/admin';

/* ─── Types ──────────────────────────────────────────────────── */

export type StepResult = {
  error: string | null;
  success: boolean;
  userId?: string;
};

/* ─── Step 1 — Create account + profile row ──────────────────── */

export async function completeStep1(input: {
  full_name: string;
  email: string;
  password: string;
}): Promise<StepResult> {
  const { full_name, email, password } = input;

  if (!full_name.trim() || !email.trim() || !password) {
    return { error: 'Please fill in all fields.', success: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: full_name.trim() } },
  });

  if (error) {
    return { error: error.message, success: false };
  }

  const userId = data.user?.id;
  if (!userId || data.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists.', success: false };
  }

  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: userId,
    full_name: full_name.trim(),
    email: email.trim(),
    status: 'pending_email',
    registration_step: 1,
  });

  if (profileError) {
    return { error: profileError.message, success: false };
  }

  return { error: null, success: true, userId };
}

/* ─── Step 2 — Save degrees ──────────────────────────────────── */

export async function completeStep2(input: {
  userId: string;
  selectedLevels: Array<'BS' | 'MS' | 'PhD'>;
  degreeValues: Partial<
    Record<'BS' | 'MS' | 'PhD', { registration_no: string; intake_year: number; graduation_year: number }>
  >;
}): Promise<StepResult> {
  const { userId, selectedLevels, degreeValues } = input;

  if (!selectedLevels || selectedLevels.length === 0) {
    return { error: 'Select at least one degree.', success: false };
  }

  for (const level of selectedLevels) {
    const dv = degreeValues[level];
    if (!dv || !dv.registration_no?.trim()) {
      return { error: `Please fill in all fields for ${level}.`, success: false };
    }
    if (dv.graduation_year && dv.intake_year && dv.graduation_year < dv.intake_year) {
      return { error: `${level}: Graduation year must be ≥ intake year.`, success: false };
    }

    await adminClient.from('degrees').upsert(
      {
        profile_id: userId,
        level,
        registration_no: dv.registration_no.trim(),
        intake_year: dv.intake_year || 0,
        graduation_year: dv.graduation_year || 0,
      },
      { onConflict: 'profile_id,level' },
    );
  }

  // Delete unchecked degrees
  const toDelete = ['BS', 'MS', 'PhD'].filter(
    (l) => !selectedLevels.includes(l as 'BS' | 'MS' | 'PhD'),
  );
  if (toDelete.length > 0) {
    await adminClient
      .from('degrees')
      .delete()
      .eq('profile_id', userId)
      .in('level', toDelete);
  }

  await adminClient
    .from('profiles')
    .update({ registration_step: 2 })
    .eq('id', userId);

  return { error: null, success: true };
}

/* ─── Step 3 — Save profile details ──────────────────────────── */

export async function completeStep3(input: {
  userId: string;
  phone: string;
  city: string;
  country: string;
  postal_address: string;
  bio: string;
}): Promise<StepResult> {
  const { userId, phone, city, country, postal_address, bio } = input;

  await adminClient
    .from('profiles')
    .update({
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      country: country?.trim().toUpperCase() || null,
      postal_address: postal_address?.trim() || null,
      bio: bio?.trim() || null,
      registration_step: 3,
    })
    .eq('id', userId);

  return { error: null, success: true };
}

/* ─── Step 4 — Save employment history ───────────────────────── */

export async function completeStep4(input: {
  userId: string;
  employment: Array<{
    job_title: string;
    company: string;
    employment_type: string;
    start_month: string;
    end_month: string;
  }>;
}): Promise<StepResult> {
  const { userId, employment } = input;

  // Clear existing and re-insert
  await adminClient.from('employment_history').delete().eq('profile_id', userId);

  if (employment && employment.length > 0) {
    for (const entry of employment) {
      if (!entry.job_title?.trim() || !entry.company?.trim()) continue;
      await adminClient.from('employment_history').insert({
        profile_id: userId,
        job_title: entry.job_title.trim(),
        company: entry.company.trim(),
        employment_type: entry.employment_type || null,
        start_month: entry.start_month ? `${entry.start_month}-01` : null,
        end_month: entry.end_month ? `${entry.end_month}-01` : null,
      });
    }
  }

  await adminClient
    .from('profiles')
    .update({ registration_step: 4 })
    .eq('id', userId);

  return { error: null, success: true };
}

/* ─── Step 5 — Save skills ───────────────────────────────────── */

export async function completeStep5(input: {
  userId: string;
  skills: string[];
}): Promise<StepResult> {
  const { userId, skills } = input;

  // Clear existing
  await adminClient.from('profile_skills').delete().eq('profile_id', userId);

  if (skills && skills.length > 0) {
    const unique = Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean))).slice(0, 20);
    for (const name of unique) {
      const { data: existing } = await adminClient
        .from('skills')
        .select('id')
        .ilike('name', name)
        .maybeSingle();

      let skillId = existing?.id;
      if (!skillId) {
        const { data: created } = await adminClient
          .from('skills')
          .insert({ name, is_predefined: false })
          .select('id')
          .single();
        skillId = created?.id;
      }

      if (skillId) {
        await adminClient.from('profile_skills').insert({
          profile_id: userId,
          skill_id: skillId,
        });
      }
    }
  }

  await adminClient
    .from('profiles')
    .update({ registration_step: 5 })
    .eq('id', userId);

  return { error: null, success: true };
}

/* ─── Step 6 — Save privacy + consent ────────────────────────── */

export async function completeStep6(input: {
  userId: string;
  privacy_email: string;
  privacy_phone: string;
  privacy_postal_address: string;
  privacy_city: string;
  privacy_employment: string;
  consent_data_storage: boolean;
  consent_communications: boolean;
  consent_directory: boolean;
}): Promise<StepResult> {
  const {
    userId,
    privacy_email,
    privacy_phone,
    privacy_postal_address,
    privacy_city,
    privacy_employment,
    consent_directory,
  } = input;

  const privacySettings = {
    email: privacy_email || 'private',
    phone: privacy_phone || 'private',
    postal_address: privacy_postal_address || 'private',
    city: privacy_city || 'alumni_only',
    employment: privacy_employment || 'public',
  };

  await adminClient
    .from('profiles')
    .update({
      privacy_settings: privacySettings,
      directory_visible: consent_directory,
      registration_step: 6,
    })
    .eq('id', userId);

  return { error: null, success: true };
}
