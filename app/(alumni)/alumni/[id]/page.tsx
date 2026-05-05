import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';

import { createClient } from '@/lib/supabase/server';
import { SectionCard } from '@/components/ui/section-card';

type PrivacyLevel = 'public' | 'alumni_only' | 'private';

function canView(
  level: PrivacyLevel,
  isOwner: boolean,
  isAlumni: boolean,
): boolean {
  if (isOwner) return true;
  if (level === 'public') return true;
  if (level === 'alumni_only') return isAlumni;
  return false;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatMonth(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('full_name, bio')
    .eq('id', id)
    .maybeSingle();
  if (!data) return { title: 'Alumni Profile · CSE Alumni' };
  return {
    title: `${data.full_name as string} · CSE Alumni`,
    description: data.bio
      ? (data.bio as string).slice(0, 160)
      : undefined,
  };
}

export default async function AlumniProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/alumni/${id}`);
  }

  const isOwner = user.id === id;

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  // Non-active users can only view their own profile
  if (!viewerProfile || (viewerProfile.status !== 'active' && !isOwner)) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <div className="rounded-lg border border-default bg-surface-100 p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-300">
            <Users className="h-5 w-5 text-foreground-lighter" />
          </div>
          <h2 className="text-base font-medium text-foreground">
            Account pending approval
          </h2>
          <p className="mt-1 text-sm text-foreground-light">
            Your account is awaiting admin approval. You can view your own profile but cannot browse other alumni yet.
          </p>
        </div>
      </div>
    );
  }

  const isAlumni = viewerProfile.status === 'active';

  // Fetch all profile data in parallel
  const [
    { data: profile },
    { data: degrees },
    { data: employment },
    { data: skillRows },
    { data: highlights },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('degrees').select('*').eq('profile_id', id).order('intake_year'),
    supabase
      .from('employment_history')
      .select('*')
      .eq('profile_id', id)
      .order('start_month', { ascending: false }),
    supabase.from('profile_skills').select('skills(name)').eq('profile_id', id),
    supabase
      .from('career_highlights')
      .select('*')
      .eq('profile_id', id)
      .order('sort_order'),
  ]);

  if (!profile) return notFound();
  if (!(profile.directory_visible as boolean) && !isOwner) return notFound();

  const privacy =
    (profile.privacy_settings as Record<string, PrivacyLevel>) ?? {};

  const showCity = canView(privacy.city ?? 'alumni_only', isOwner, isAlumni);
  const showEmployment = canView(
    privacy.employment ?? 'public',
    isOwner,
    isAlumni,
  );
  const showPhone = canView(privacy.phone ?? 'private', isOwner, isAlumni);

  const skills = (skillRows ?? [])
    .map((row) => {
      const v = row.skills as { name?: string } | { name?: string }[] | null;
      return Array.isArray(v) ? v[0]?.name : v?.name;
    })
    .filter((n): n is string => Boolean(n));

  // Determine current job for header
  const currentJob =
    (employment ?? []).find((e) => !(e.end_month as string | null)) ??
    (employment ?? [])[0] ??
    null;

  const location = [
    showCity ? (profile.city as string | null) : null,
    profile.country as string | null,
  ]
    .filter(Boolean)
    .join(', ');

  const joinedYear = new Date(profile.created_at as string).getFullYear();

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Back link */}
      <Link
        href="/alumni"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-foreground-lighter transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to directory
      </Link>

      {/* Profile header */}
      <div className="mb-6 rounded-lg border border-default bg-surface-100 p-6">
        <div className="flex items-start gap-5">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url as string}
              alt={profile.full_name as string}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-300 text-lg font-medium text-foreground-light">
              {initials(profile.full_name as string)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium text-foreground">
              {profile.full_name as string}
            </h1>

            {currentJob ? (
              <p className="mt-0.5 text-sm text-foreground-light">
                {currentJob.job_title as string} at{' '}
                {currentJob.company as string}
              </p>
            ) : null}

            {(degrees ?? []).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {(degrees ?? []).map((d) => (
                  <span
                    key={d.id as string}
                    className="rounded bg-surface-300 px-2 py-0.5 text-xs text-foreground-lighter"
                  >
                    {d.level as string}{' '}
                    {d.graduation_year ? `'${String(d.graduation_year as number).slice(-2)}` : ''}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-4 text-xs text-foreground-lighter">
              {location ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              ) : null}
              <span>Joined {joinedYear}</span>
            </div>
          </div>

          {isOwner ? (
            <Link
              href="/profile/edit"
              className="shrink-0 rounded-md border border-border-secondary bg-button px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-300"
            >
              Edit profile
            </Link>
          ) : null}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Bio */}
          <SectionCard title="About">
            {profile.bio ? (
              <p className="text-sm leading-relaxed text-foreground-light">
                {profile.bio as string}
              </p>
            ) : (
              <p className="text-sm text-foreground-lighter">No bio added.</p>
            )}
          </SectionCard>

          {/* Employment */}
          {showEmployment ? (
            <SectionCard title="Experience">
              {(employment ?? []).length > 0 ? (
                <div className="space-y-4">
                  {(employment ?? []).map((item) => (
                    <div
                      key={item.id as string}
                      className="flex items-start gap-3"
                    >
                      {/* Company initial avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-300 text-xs font-medium text-foreground-light">
                        {(item.company as string)[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.job_title as string}
                            </p>
                            <p className="text-xs text-foreground-light">
                              {item.company as string}
                              {item.employment_type
                                ? ` · ${(item.employment_type as string).replace('_', '-')}`
                                : ''}
                            </p>
                          </div>
                          {!(item.end_month as string | null) ? (
                            <span className="shrink-0 rounded border border-brand/20 bg-brand/10 px-1.5 py-0.5 text-[11px] text-brand">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-foreground-lighter">
                          {formatMonth(item.start_month as string)} —{' '}
                          {item.end_month
                            ? formatMonth(item.end_month as string)
                            : 'Present'}
                        </p>
                        {item.description ? (
                          <p className="mt-1 text-xs text-foreground-light">
                            {item.description as string}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-foreground-lighter">
                  <Briefcase className="h-4 w-4" />
                  No employment history added.
                </p>
              )}
            </SectionCard>
          ) : null}

          {/* Career highlights */}
          {(highlights ?? []).length > 0 ? (
            <SectionCard title="Career highlights">
              <div className="space-y-4">
                {(highlights ?? []).map((h) => (
                  <div key={h.id as string}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {h.title as string}
                      </p>
                      {h.year ? (
                        <span className="shrink-0 font-mono text-xs text-foreground-lighter">
                          {h.year as number}
                        </span>
                      ) : null}
                    </div>
                    {h.description ? (
                      <p className="mt-0.5 text-xs text-foreground-light">
                        {h.description as string}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Skills */}
          <SectionCard title="Skills">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded bg-surface-300 px-2 py-0.5 text-xs text-foreground-light"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-lighter">No skills added.</p>
            )}
          </SectionCard>

          {/* Contact / details (privacy-filtered) */}
          <SectionCard title="Details">
            <div className="space-y-2.5 text-sm">
              {/* City */}
              {showCity && (profile.city as string | null) ? (
                <div className="flex items-center gap-2 text-foreground-light">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground-lighter" />
                  <span>
                    {profile.city as string}
                    {profile.country ? `, ${profile.country as string}` : ''}
                  </span>
                </div>
              ) : null}

              {/* Phone — alumni-only or private, never public */}
              {showPhone && (profile.phone as string | null) ? (
                <div>
                  <p className="text-xs text-foreground-lighter">Phone</p>
                  <p className="mt-0.5 font-mono text-xs text-foreground-light">
                    {profile.phone as string}
                  </p>
                </div>
              ) : null}

              {/* Completeness score (only for owner) */}
              {isOwner ? (
                <div>
                  <p className="text-xs text-foreground-lighter">
                    Profile completeness
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-300">
                      <div
                        className="h-1.5 rounded-full bg-brand"
                        style={{
                          width: `${profile.completeness_score as number}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-foreground-lighter">
                      {profile.completeness_score as number}%
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Registration year */}
              <div>
                <p className="text-xs text-foreground-lighter">Member since</p>
                <p className="mt-0.5 text-xs text-foreground-light">
                  {joinedYear}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
