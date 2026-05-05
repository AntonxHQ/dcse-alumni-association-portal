import { redirect } from 'next/navigation';

import { AuthShell } from '../../../../components/auth/auth-shell';
import { adminClient } from '../../../../lib/supabase/admin';
import { createClient } from '../../../../lib/supabase/server';
import { RegisterWizard, type ResumeData } from './register-wizard';

export default async function RegisterPage() {
  let resumeData: ResumeData | undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const [{ data: profile }, { data: degrees }, { data: employment }, { data: highlights }, { data: skillRows }] = await Promise.all([
      adminClient.from('profiles').select('*').eq('id', user.id).single(),
      adminClient.from('degrees').select('*').eq('profile_id', user.id),
      adminClient.from('employment_history').select('*').eq('profile_id', user.id).order('start_month', { ascending: false }),
      adminClient.from('career_highlights').select('*').eq('profile_id', user.id).order('sort_order', { ascending: true }),
      adminClient.from('profile_skills').select('skills(name)').eq('profile_id', user.id),
    ]);

    if (profile) {
      const step = profile.registration_step as number;
      if (step >= 6) {
        redirect('/dashboard');
      }

      resumeData = {
        userId: user.id,
        initialStep: step,
        profile: {
          full_name: profile.full_name as string,
          email: profile.email as string,
          phone: profile.phone as string | null,
          city: profile.city as string | null,
          country: profile.country as string | null,
          postal_address: profile.postal_address as string | null,
          bio: profile.bio as string | null,
          privacy_settings: profile.privacy_settings as Record<string, string> | null,
        },
        degrees: (degrees || []).map((d) => ({
          level: d.level as 'BS' | 'MS' | 'PhD',
          registration_no: d.registration_no as string,
          intake_year: d.intake_year as number | null,
        })),
        employment: (employment || []).map((e) => ({
          job_title: e.job_title as string,
          company: e.company as string,
          employment_type: e.employment_type as string,
          start_month: (e.start_month as string).substring(0, 7),
          end_month: e.end_month ? (e.end_month as string).substring(0, 7) : '',
        })),
        achievements: (highlights || []).map((h) => ({
          title: h.title as string,
          year: h.year as number | undefined,
          description: h.description as string | undefined,
        })),
        skills: (skillRows || []).map((r) => {
          const s = r.skills as unknown as { name?: string } | null;
          return s?.name ?? '';
        }).filter(Boolean),
      };
    }
  }

  return (
    <AuthShell
      subtitle={resumeData ? 'Complete your profile to join the alumni directory' : 'Join DCSE Alumni Community'}
      title={resumeData ? 'Complete your profile' : 'Create your account'}
      wide
    >
      <RegisterWizard resumeData={resumeData} />
    </AuthShell>
  );
}
