'use client';

import { Camera, Lock, Plus, Trash2, Users, X } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { SearchableSelect } from '../../../../components/ui/searchable-select';
import { City, Country } from 'country-state-city';
import {
  saveAchievements,
  saveAvatarUrl,
  saveDegrees,
  saveEmployment,
  savePrivacySettings,
  saveProfileBasics,
  saveSkills,
} from './actions';

/* ─── Types ──────────────────────────────────────────────────── */

type Degree = { level: 'BS' | 'MS' | 'PhD'; registration_no: string; intake_year: number | null };
type EmploymentEntry = { id?: string; job_title: string; company: string; employment_type: string; start_month: string; end_month: string };
type Achievement = { title: string; year?: number; description?: string };

type ProfileEditData = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  postal_address: string | null;
  bio: string | null;
  privacy_settings: Record<string, string> | null;
  degrees: Degree[];
  employment: EmploymentEntry[];
  skills: string[];
  achievements: Achievement[];
};

/* ─── Constants ──────────────────────────────────────────────── */

const DEGREE_META: Record<'BS' | 'MS' | 'PhD', { label: string; batchRequired: boolean }> = {
  BS: { label: 'Bachelor of Science', batchRequired: true },
  MS: { label: 'Master of Science', batchRequired: false },
  PhD: { label: 'Doctor of Philosophy', batchRequired: false },
};

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
  { value: 'self_employed', label: 'Self-employed' },
];

const PREDEFINED_SKILLS = [
  'Embedded Systems', 'VLSI Design', 'Computer Networks', 'Machine Learning',
  'Operating Systems', 'PCB Design', 'IoT', 'Cybersecurity',
  'Software Engineering', 'Digital Signal Processing', 'Python', 'C/C++',
  'Java', 'Web Development', 'Mobile Development', 'Cloud Computing',
];

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const PRIVACY_OPTIONS = [
  { value: 'alumni_only', label: 'Alumni only', icon: <Users className="h-3.5 w-3.5" /> },
  { value: 'private', label: 'Private', icon: <Lock className="h-3.5 w-3.5" /> },
];

const PRIVACY_FIELDS = [
  { key: 'email', label: 'Email address' },
  { key: 'phone', label: 'Phone number' },
  { key: 'postal_address', label: 'Postal address' },
  { key: 'city', label: 'City & country' },
  { key: 'employment', label: 'Employment history' },
] as const;

/* ─── Small reusable pieces ──────────────────────────────────── */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4 border-b border-border-muted pb-4">
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      <p className="mt-0.5 text-sm text-foreground-light">{description}</p>
    </div>
  );
}

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground-light">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-foreground-lighter">(optional)</span>}
      </span>
      {children}
    </div>
  );
}

function SaveBtn({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      className="rounded-md border border-secondary bg-button px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-strong hover:bg-surface-300 disabled:opacity-60"
      disabled={loading}
      onClick={onClick}
      type="button"
    >
      {loading ? 'Saving…' : 'Save'}
    </button>
  );
}

function MonthYearPicker({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i), [currentYear]);
  const [yearPart, monthPart] = value ? value.split('-') : ['', ''];

  return (
    <div className="flex gap-2">
      <select className="flex-[2]" onChange={(e) => onChange(e.target.value && monthPart ? `${e.target.value}-${monthPart}` : e.target.value ? `${e.target.value}-01` : '')} value={yearPart || ''}>
        <option value="">{placeholder ?? 'Year'}</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <select className="flex-[3]" disabled={!yearPart} onChange={(e) => onChange(yearPart && e.target.value ? `${yearPart}-${e.target.value}` : '')} value={monthPart || ''}>
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  );
}

/* ─── Main client component ──────────────────────────────────── */

export function ProfileEditClient({ initial }: { initial: ProfileEditData }) {
  const initials = initial.full_name.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  const currentYear = new Date().getFullYear();
  const batches = useMemo(() => Array.from({ length: currentYear - 1998 }, (_, i) => i + 1), [currentYear]);
  const intakeYears = useMemo(() => Array.from({ length: currentYear - 1998 }, (_, i) => 1999 + i), [currentYear]);

  // Country/city options
  const countryOptions = useMemo(() => Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name })), []);

  // ── Basic info state ───────────────────────────────────────
  const [basics, setBasics] = useState({
    full_name: initial.full_name,
    phone: initial.phone ?? '',
    city: initial.city ?? '',
    country: initial.country ?? '',
    postal_address: initial.postal_address ?? '',
    bio: initial.bio ?? '',
  });
  const [basicsSaving, setBasicsSaving] = useState(false);

  const cityOptions = useMemo(() => {
    if (!basics.country) return [];
    return (City.getCitiesOfCountry(basics.country) ?? []).map((c) => ({ value: c.name, label: c.name }));
  }, [basics.country]);

  // ── Degrees state ──────────────────────────────────────────
  const initDegreeValues = Object.fromEntries(
    initial.degrees.map((d) => [d.level, {
      registration_no: d.registration_no,
      batch_no: d.intake_year ? d.intake_year - 1998 : undefined,
    }])
  ) as Partial<Record<'BS' | 'MS' | 'PhD', { registration_no: string; batch_no?: number }>>;

  const [selectedLevels, setSelectedLevels] = useState<Array<'BS' | 'MS' | 'PhD'>>(initial.degrees.map((d) => d.level));
  const [degreeValues, setDegreeValues] = useState(initDegreeValues);
  const [degreesSaving, setDegreesSaving] = useState(false);

  // ── Employment state ───────────────────────────────────────
  const [employment, setEmployment] = useState<EmploymentEntry[]>(initial.employment);
  const [empSaving, setEmpSaving] = useState(false);

  // ── Achievements state ─────────────────────────────────────
  const [achievements, setAchievements] = useState<Achievement[]>(initial.achievements);
  const [achSaving, setAchSaving] = useState(false);
  const achievementYears = useMemo(() => Array.from({ length: currentYear - 1994 }, (_, i) => currentYear - i), [currentYear]);

  // ── Skills state ───────────────────────────────────────────
  const [skills, setSkills] = useState(initial.skills);
  const [skillQuery, setSkillQuery] = useState('');
  const [skillsSaving, setSkillsSaving] = useState(false);
  const filteredSkillOptions = skillQuery
    ? PREDEFINED_SKILLS.filter((s) => s.toLowerCase().includes(skillQuery.toLowerCase()) && !skills.includes(s))
    : [];

  // ── Privacy state ──────────────────────────────────────────
  const initPrivacy = {
    email: (initial.privacy_settings?.email ?? 'private') as 'alumni_only' | 'private',
    phone: (initial.privacy_settings?.phone ?? 'private') as 'alumni_only' | 'private',
    postal_address: (initial.privacy_settings?.postal_address ?? 'private') as 'alumni_only' | 'private',
    city: (initial.privacy_settings?.city ?? 'alumni_only') as 'alumni_only' | 'private',
    employment: (initial.privacy_settings?.employment ?? 'alumni_only') as 'alumni_only' | 'private',
  };
  const [privacy, setPrivacy] = useState(initPrivacy);
  const [privacySaving, setPrivacySaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* ── Avatar ───────────────────────────────────────────────── */
  async function onUploadAvatar(file: File) {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only JPEG and PNG files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be 10 MB or less');
      return;
    }
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok) { toast.error(json.error ?? 'Upload failed'); return; }
      setAvatarUrl(json.url!);
      await saveAvatarUrl(json.url!);
      toast.success('Avatar updated');
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-6 py-8">
      <div>
        <h2 className="text-2xl font-medium text-foreground" style={{ letterSpacing: '-0.3px' }}>Edit profile</h2>
        <p className="mt-1 text-sm text-foreground-light">Update your profile information.</p>
      </div>

      {/* ── Avatar ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <SectionHeader title="Avatar" description="Your public profile picture." />
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <Image alt="Avatar" className="h-16 w-16 rounded-full object-cover" height={64} src={avatarUrl} unoptimized width={64} />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-300 text-lg font-medium text-foreground-light">{initials}</div>
          )}
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-secondary bg-button px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-strong hover:bg-surface-300 ${avatarUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            <Camera className="h-4 w-4" />
            {avatarUploading ? 'Uploading…' : 'Upload photo'}
            <input className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUploadAvatar(f); }} type="file" accept="image/jpeg,image/png" />
          </label>
        </div>
      </section>

      {/* ── Basic info ────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <SectionHeader title="Basic info" description="Your name, bio, and contact details." />
        <div className="flex flex-col gap-4">
          {/* Bio at the top */}
          <Field label="Bio" optional>
            <textarea
              className="resize-none"
              maxLength={300}
              onChange={(e) => setBasics((b) => ({ ...b, bio: e.target.value }))}
              placeholder="A short intro about yourself…"
              rows={3}
              value={basics.bio}
            />
            <p className="mt-0.5 text-right text-xs text-foreground-lighter">{basics.bio.length}/300</p>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input onChange={(e) => setBasics((b) => ({ ...b, full_name: e.target.value }))} placeholder="Full name" value={basics.full_name} />
            </Field>
            <Field label="Email">
              <input className="opacity-60" disabled value={initial.email} />
            </Field>
            <Field label="Phone" optional>
              <input onChange={(e) => setBasics((b) => ({ ...b, phone: e.target.value }))} placeholder="+923001234567" type="tel" value={basics.phone} />
            </Field>
            <Field label="Postal address" optional>
              <input onChange={(e) => setBasics((b) => ({ ...b, postal_address: e.target.value }))} placeholder="Street, City, Country" value={basics.postal_address} />
            </Field>
          </div>

          {/* Location */}
          <div className="rounded-md border border-border bg-surface-100 p-4">
            <h4 className="mb-3 text-sm font-medium text-foreground">Current location</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Country" optional>
                <SearchableSelect
                  onChange={(val) => setBasics((b) => ({ ...b, country: val, city: '' }))}
                  options={countryOptions}
                  placeholder="Select country"
                  value={basics.country}
                />
              </Field>
              <Field label="City" optional>
                <SearchableSelect
                  disabled={!basics.country || cityOptions.length === 0}
                  onChange={(val) => setBasics((b) => ({ ...b, city: val }))}
                  options={cityOptions}
                  placeholder={!basics.country ? 'Select country first' : 'Select city'}
                  value={basics.city}
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border-muted pt-4">
            <p className="text-xs text-foreground-lighter">Changes are saved per section.</p>
            <SaveBtn loading={basicsSaving} onClick={async () => {
              setBasicsSaving(true);
              try { await saveProfileBasics(basics); toast.success('Saved'); } catch { toast.error('Could not save'); }
              setBasicsSaving(false);
            }} />
          </div>
        </div>
      </section>

      {/* ── Degrees ───────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <SectionHeader title="Academic background" description="Your degree(s) from the CSE department." />
        <div className="flex flex-col gap-3">
          {(['BS', 'MS', 'PhD'] as const).map((level) => {
            const checked = selectedLevels.includes(level);
            const meta = DEGREE_META[level];
            const dv = degreeValues[level] ?? { registration_no: '', batch_no: undefined };
            return (
              <div className={`rounded-lg border transition-colors ${checked ? 'border-brand bg-brand/5' : 'border-border-muted bg-surface-100'}`} key={level}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                  <input
                    checked={checked}
                    className="h-4 w-4 accent-brand"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedLevels((s) => [...s, level]);
                      else setSelectedLevels((s) => s.filter((l) => l !== level));
                    }}
                    type="checkbox"
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">{level}</span>
                      <span className="ml-2 text-sm text-foreground-light">{meta.label}</span>
                    </div>
                  </div>
                </label>
                {checked && (
                  <div className="border-t border-border-muted px-4 pb-4 pt-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Registration No.">
                        <input
                          onChange={(e) => setDegreeValues((v) => ({ ...v, [level]: { ...dv, registration_no: e.target.value } }))}
                          placeholder="15PWCSE1281"
                          value={dv.registration_no}
                        />
                      </Field>
                      {level === 'BS' ? (
                        <Field label="Batch">
                          <select
                            onChange={(e) => setDegreeValues((v) => ({ ...v, [level]: { ...dv, batch_no: e.target.value ? Number(e.target.value) : undefined } }))}
                            value={dv.batch_no ?? ''}
                          >
                            <option value="">Select batch</option>
                            {batches.map((batch) => (
                              <option key={batch} value={batch}>Batch {batch}</option>
                            ))}
                          </select>
                        </Field>
                      ) : (
                        <Field label="Intake year" optional>
                          <select
                            onChange={(e) => {
                              const year = Number(e.target.value);
                              setDegreeValues((v) => ({ ...v, [level]: { ...dv, batch_no: year ? year - 1998 : undefined } }));
                            }}
                            value={dv.batch_no ? String(1998 + dv.batch_no) : ''}
                          >
                            <option value="">Select year</option>
                            {intakeYears.map((year) => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </Field>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t border-border-muted pt-4 mt-1">
            <p className="text-xs text-foreground-lighter">Select all degrees you completed.</p>
            <SaveBtn loading={degreesSaving} onClick={async () => {
              setDegreesSaving(true);
              try { await saveDegrees({ selectedLevels, values: degreeValues }); toast.success('Saved'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); }
              setDegreesSaving(false);
            }} />
          </div>
        </div>
      </section>

      {/* ── Employment ────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <SectionHeader title="Employment history" description="Your career positions and timeline." />
        <div className="flex flex-col gap-3">
          {employment.map((item, index) => (
            <div className="rounded-lg border border-border-muted bg-surface-200 p-4" key={index}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-lighter">Position {index + 1}</span>
                <button
                  className="rounded-md p-1.5 text-foreground-lighter transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setEmployment((e) => e.filter((_, i) => i !== index))}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Job title">
                  <input onChange={(e) => setEmployment((emp) => emp.map((en, i) => i === index ? { ...en, job_title: e.target.value } : en))} placeholder="e.g. Software Engineer" value={item.job_title} />
                </Field>
                <Field label="Company">
                  <input onChange={(e) => setEmployment((emp) => emp.map((en, i) => i === index ? { ...en, company: e.target.value } : en))} placeholder="Company name" value={item.company} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Employment type" optional>
                    <select onChange={(e) => setEmployment((emp) => emp.map((en, i) => i === index ? { ...en, employment_type: e.target.value } : en))} value={item.employment_type ?? ''}>
                      <option value="">Select type</option>
                      {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Start date">
                  <MonthYearPicker onChange={(v) => setEmployment((emp) => emp.map((en, i) => i === index ? { ...en, start_month: v } : en))} placeholder="Start year" value={item.start_month} />
                </Field>
                <Field label="End date" optional>
                  <MonthYearPicker onChange={(v) => setEmployment((emp) => emp.map((en, i) => i === index ? { ...en, end_month: v } : en))} placeholder="End year" value={item.end_month} />
                  <p className="mt-0.5 text-xs text-foreground-lighter">Leave empty for current role</p>
                </Field>
              </div>
            </div>
          ))}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-secondary py-3 text-sm font-medium text-foreground-lighter transition-colors hover:border-border-strong hover:bg-surface-200 hover:text-foreground-light"
            onClick={() => setEmployment((e) => [...e, { job_title: '', company: '', employment_type: '', start_month: '', end_month: '' }])}
            type="button"
          >
            <Plus className="h-4 w-4" /> Add position
          </button>
          <div className="flex items-center justify-between border-t border-border-muted pt-4">
            <p className="text-xs text-foreground-lighter" />
            <SaveBtn loading={empSaving} onClick={async () => {
              setEmpSaving(true);
              try { await saveEmployment(employment); toast.success('Saved'); } catch { toast.error('Could not save'); }
              setEmpSaving(false);
            }} />
          </div>
        </div>
      </section>

      {/* ── Achievements ──────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <SectionHeader title="Achievements" description="Awards, certifications, publications, and milestones." />
        <div className="flex flex-col gap-3">
          {achievements.length === 0 && (
            <div className="rounded-lg border border-dashed border-border-secondary py-6 text-center">
              <p className="text-sm text-foreground-lighter">No achievements added yet.</p>
            </div>
          )}
          {achievements.map((ach, index) => (
            <div className="rounded-lg border border-border-muted bg-surface-200 p-4" key={index}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-lighter">Achievement {index + 1}</span>
                <button className="rounded-md p-1.5 text-foreground-lighter transition-colors hover:bg-destructive/10 hover:text-destructive" onClick={() => setAchievements((a) => a.filter((_, i) => i !== index))} type="button">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Field label="Title">
                      <input onChange={(e) => setAchievements((a) => a.map((en, i) => i === index ? { ...en, title: e.target.value } : en))} placeholder="e.g. Best Paper Award" value={ach.title} />
                    </Field>
                  </div>
                  <Field label="Year" optional>
                    <select onChange={(e) => setAchievements((a) => a.map((en, i) => i === index ? { ...en, year: e.target.value ? Number(e.target.value) : undefined } : en))} value={ach.year ?? ''}>
                      <option value="">Year</option>
                      {achievementYears.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Description" optional>
                  <textarea className="resize-none" onChange={(e) => setAchievements((a) => a.map((en, i) => i === index ? { ...en, description: e.target.value } : en))} placeholder="Brief description…" rows={2} value={ach.description ?? ''} />
                </Field>
              </div>
            </div>
          ))}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-secondary py-3 text-sm font-medium text-foreground-lighter transition-colors hover:border-border-strong hover:bg-surface-200 hover:text-foreground-light" onClick={() => setAchievements((a) => [...a, { title: '', year: undefined, description: '' }])} type="button">
            <Plus className="h-4 w-4" /> Add achievement
          </button>
          <div className="flex items-center justify-between border-t border-border-muted pt-4">
            <p className="text-xs text-foreground-lighter" />
            <SaveBtn loading={achSaving} onClick={async () => {
              setAchSaving(true);
              try { await saveAchievements(achievements); toast.success('Saved'); } catch { toast.error('Could not save'); }
              setAchSaving(false);
            }} />
          </div>
        </div>
      </section>

      {/* ── Skills ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <SectionHeader title="Skills" description="Select up to 20 technical skills or areas of expertise." />
        {skills.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand" key={skill}>
                {skill}
                <button className="text-brand/60 transition-colors hover:text-brand" onClick={() => setSkills((s) => s.filter((x) => x !== skill))} type="button">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input onChange={(e) => setSkillQuery(e.target.value)} placeholder="Search or type a skill…" value={skillQuery} />
          {skillQuery && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface-200 py-1 shadow-sm">
              {filteredSkillOptions.map((opt) => (
                <button className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-300" key={opt} onClick={() => { if (skills.length < 20 && !skills.includes(opt)) setSkills((s) => [...s, opt]); setSkillQuery(''); }} type="button">{opt}</button>
              ))}
              {!filteredSkillOptions.find((s) => s.toLowerCase() === skillQuery.toLowerCase()) && (
                <button className="block w-full px-3 py-2 text-left text-sm text-brand transition-colors hover:bg-surface-300" onClick={() => { const t = skillQuery.trim(); if (t && skills.length < 20 && !skills.includes(t)) setSkills((s) => [...s, t]); setSkillQuery(''); }} type="button">+ Add &quot;{skillQuery}&quot;</button>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border-muted pt-4">
          <p className="text-xs text-foreground-lighter">{skills.length}/20 selected</p>
          <SaveBtn loading={skillsSaving} onClick={async () => {
            setSkillsSaving(true);
            try { await saveSkills(skills); toast.success('Saved'); } catch { toast.error('Could not save'); }
            setSkillsSaving(false);
          }} />
        </div>
      </section>

      {/* ── Privacy ───────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <SectionHeader title="Privacy settings" description="Control who can see each piece of your profile." />
        <div className="rounded-lg border border-border-muted bg-surface-100">
          {PRIVACY_FIELDS.map(({ key, label }, index) => (
            <div className={`flex items-center justify-between gap-4 px-4 py-3 ${index < PRIVACY_FIELDS.length - 1 ? 'border-b border-border-muted' : ''}`} key={key}>
              <span className="text-sm font-medium text-foreground">{label}</span>
              <div className="flex overflow-hidden rounded-md border border-border-control">
                {PRIVACY_OPTIONS.map((opt) => (
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${privacy[key] === opt.value ? 'bg-brand text-foreground-contrast' : 'bg-surface-200 text-foreground-lighter hover:bg-surface-300 hover:text-foreground-light'}`}
                    key={opt.value}
                    onClick={() => setPrivacy((p) => ({ ...p, [key]: opt.value }))}
                    type="button"
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border-muted pt-4">
          <p className="text-xs text-foreground-lighter">Changes take effect within 60 seconds.</p>
          <SaveBtn loading={privacySaving} onClick={async () => {
            setPrivacySaving(true);
            try { await savePrivacySettings(privacy); toast.success('Saved'); } catch { toast.error('Could not save'); }
            setPrivacySaving(false);
          }} />
        </div>
      </section>
    </div>
  );
}
