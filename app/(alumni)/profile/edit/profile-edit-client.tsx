'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Plus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  createEmployment,
  deleteEmployment,
  saveAvatarUrl,
  saveDegrees,
  savePrivacySettings,
  saveProfileBasics,
  saveSkills,
} from './actions';

import { City, Country } from 'country-state-city';

type Degree = {
  level: 'BS' | 'MS' | 'PhD';
  registration_no: string;
  intake_year: number;
  graduation_year: number;
};

type Employment = {
  id: string;
  job_title: string;
  company: string;
  employment_type: string | null;
  start_month: string;
  end_month: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
};

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
  employment: Employment[];
  skills: string[];
};

const basicsSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string(),
  city: z.string(),
  country: z.string().max(2),
  postal_address: z.string(),
  bio: z.string().max(300),
});

const degreeRow = z
  .object({
    registration_no: z.string().min(1),
    intake_year: z.number().int().min(1980),
    graduation_year: z.number().int().min(1980),
  })
  .refine((value) => value.graduation_year >= value.intake_year, {
    message: 'Graduation year must be after intake year',
    path: ['graduation_year'],
  });

const degreeSchema = z.object({
  selectedLevels: z.array(z.enum(['BS', 'MS', 'PhD'])),
  values: z.object({
    BS: degreeRow.optional(),
    MS: degreeRow.optional(),
    PhD: degreeRow.optional(),
  }),
});

const privacySchema = z.object({
  email: z.enum(['alumni_only', 'private']),
  phone: z.enum(['alumni_only', 'private']),
  postal_address: z.enum(['alumni_only', 'private']),
  city: z.enum(['public', 'alumni_only', 'private']),
  employment: z.enum(['public', 'alumni_only']),
});

/* ─── Reusable field wrapper ────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground-light">{label}</span>
      {children}
    </div>
  );
}

/* ─── Section save button (secondary / default button) ──────── */
function SaveButton({ type = 'submit', onClick }: { type?: 'submit' | 'button'; onClick?: () => void }) {
  return (
    <button
      className="mt-4 rounded-md border border-secondary bg-button px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-strong hover:bg-surface-300 focus:outline-none focus:ring-2 focus:ring-white/10"
      onClick={onClick}
      type={type}
    >
      Save
    </button>
  );
}

export function ProfileEditClient({ initial }: { initial: ProfileEditData }) {
  const initials = initial.full_name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const [skills, setSkills] = useState(initial.skills);
  const [skillQuery, setSkillQuery] = useState('');
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [employmentList, setEmploymentList] = useState(initial.employment);
  const years = useMemo(
    () => Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => 1980 + i),
    [],
  );

  const basicsForm = useForm<z.infer<typeof basicsSchema>>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      full_name: initial.full_name,
      phone: initial.phone ?? '',
      city: initial.city ?? '',
      country: initial.country ?? '',
      postal_address: initial.postal_address ?? '',
      bio: initial.bio ?? '',
    },
  });

  const selectedCountryCode = useWatch({ control: basicsForm.control, name: 'country' });
  const countries = Country.getAllCountries();
  const cities = selectedCountryCode ? City.getCitiesOfCountry(selectedCountryCode) : [];

  const degreeDefaults: z.infer<typeof degreeSchema> = {
    selectedLevels: initial.degrees.map((degree) => degree.level),
    values: {
      BS: initial.degrees.find((degree) => degree.level === 'BS'),
      MS: initial.degrees.find((degree) => degree.level === 'MS'),
      PhD: initial.degrees.find((degree) => degree.level === 'PhD'),
    },
  };
  const degreeForm = useForm<z.infer<typeof degreeSchema>>({
    resolver: zodResolver(degreeSchema),
    defaultValues: degreeDefaults,
  });
  const selectedLevels = useWatch({
    control: degreeForm.control,
    name: 'selectedLevels',
    defaultValue: degreeDefaults.selectedLevels,
  });

  const privacyForm = useForm<z.infer<typeof privacySchema>>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      email: (initial.privacy_settings?.email as 'alumni_only' | 'private') ?? 'private',
      phone: (initial.privacy_settings?.phone as 'alumni_only' | 'private') ?? 'private',
      postal_address:
        (initial.privacy_settings?.postal_address as 'alumni_only' | 'private') ?? 'private',
      city: (initial.privacy_settings?.city as 'public' | 'alumni_only' | 'private') ?? 'alumni_only',
      employment:
        (initial.privacy_settings?.employment as 'public' | 'alumni_only') ?? 'public',
    },
  });
  const privacyRows: Array<{
    field: keyof z.infer<typeof privacySchema>;
    label: string;
    options: string[];
  }> = [
      { field: 'email', label: 'Email', options: ['alumni_only', 'private'] },
      { field: 'phone', label: 'Phone', options: ['alumni_only', 'private'] },
      {
        field: 'postal_address',
        label: 'Postal address',
        options: ['alumni_only', 'private'],
      },
      { field: 'city', label: 'City', options: ['public', 'alumni_only', 'private'] },
      { field: 'employment', label: 'Employment', options: ['public', 'alumni_only'] },
    ];

  async function onUploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
    if (!response.ok) {
      toast.error('Failed to upload avatar');
      return;
    }
    const payload = (await response.json()) as { url: string };
    await saveAvatarUrl(payload.url);
    toast.success('Saved');
  }

  async function querySkills(query: string) {
    const response = await fetch(`/api/skills/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return;
    const payload = (await response.json()) as { data: string[] };
    setSkillOptions(payload.data);
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-6 py-8">
      {/* ─── Page header ────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-medium text-foreground" style={{ letterSpacing: '-0.3px' }}>Edit profile</h2>
        <p className="mt-1 text-sm text-foreground-light">Update your profile information.</p>
      </div>

      {/* ─── Avatar ─────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <div className="mb-4 border-b border-border-muted pb-4">
          <h3 className="text-base font-medium text-foreground">Avatar</h3>
          <p className="mt-0.5 text-sm text-foreground-light">Your public profile picture.</p>
        </div>
        <div className="flex items-center gap-4">
          {initial.avatar_url ? (
            <Image
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover"
              height={64}
              src={initial.avatar_url}
              unoptimized
              width={64}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-300 text-lg font-medium text-foreground-light">
              {initials}
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-secondary bg-button px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-strong hover:bg-surface-300">
            <Camera className="h-4 w-4" />
            Upload photo
            <input
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUploadAvatar(file);
              }}
              type="file"
            />
          </label>
        </div>
      </section>

      {/* ─── Basic info ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <div className="mb-4 border-b border-border-muted pb-4">
          <h3 className="text-base font-medium text-foreground">Basic info</h3>
          <p className="mt-0.5 text-sm text-foreground-light">Manage your core profile details.</p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={basicsForm.handleSubmit(async (values) => {
            try {
              await saveProfileBasics(values);
              toast.success('Saved');
            } catch {
              toast.error('Could not save');
            }
          })}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name">
              <input {...basicsForm.register('full_name')} placeholder="Full name" />
            </Field>
            <Field label="Email">
              <input disabled value={initial.email} className="opacity-60" />
            </Field>
            <Field label="Phone">
              <input {...basicsForm.register('phone')} placeholder="+923001234567" />
            </Field>
            <Field label="Postal address">
              <input {...basicsForm.register('postal_address')} placeholder="123 Example Street" />
            </Field>
          </div>

          <div className="rounded-md border border-border bg-surface-100 p-4 mt-2">
            <h4 className="mb-4 text-sm font-medium text-foreground">Current city and country of residence</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground-light">Country</span>
                <select
                  {...basicsForm.register('country')}
                  className="w-full bg-surface-200"
                  onChange={(e) => {
                    basicsForm.setValue('country', e.target.value);
                    basicsForm.setValue('city', ''); // Reset city on country change
                  }}
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground-light">City</span>
                <select
                  {...basicsForm.register('city')}
                  className="w-full bg-surface-200"
                  disabled={!selectedCountryCode || cities?.length === 0}
                >
                  <option value="">Select City</option>
                  {cities?.map((c, index) => (
                    <option key={`${c.name}-${index}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Field label="Bio">
            <textarea {...basicsForm.register('bio')} placeholder="A short bio about yourself (max 300 chars)" rows={3} />
          </Field>
          <div className="flex items-center justify-between border-t border-border-muted pt-4">
            <p className="text-xs text-foreground-lighter">Changes are saved per section.</p>
            <SaveButton />
          </div>
        </form>
      </section>

      {/* ─── Degrees ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <div className="mb-4 border-b border-border-muted pb-4">
          <h3 className="text-base font-medium text-foreground">Degrees</h3>
          <p className="mt-0.5 text-sm text-foreground-light">Academic background and graduation records.</p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={degreeForm.handleSubmit(async (values) => {
            try {
              await saveDegrees(values);
              toast.success('Saved');
            } catch {
              toast.error('Could not save');
            }
          })}
        >
          {(['BS', 'MS', 'PhD'] as const).map((level) => {
            const checked = selectedLevels.includes(level);
            return (
              <div key={level}>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground-light">
                  <input
                    checked={checked}
                    className="h-4 w-4 accent-brand"
                    onChange={(event) => {
                      const selected = degreeForm.getValues('selectedLevels');
                      if (event.target.checked) {
                        degreeForm.setValue('selectedLevels', [...selected, level]);
                      } else {
                        degreeForm.setValue(
                          'selectedLevels',
                          selected.filter((entry) => entry !== level),
                        );
                      }
                    }}
                    type="checkbox"
                  />
                  {level}
                </label>
                {checked ? (
                  <div className="mt-3 rounded-md border border-border-muted bg-surface-200 p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Registration no.">
                        <input {...degreeForm.register(`values.${level}.registration_no`)} placeholder="2020-CSE-0001" />
                      </Field>
                      <Field label="Intake year">
                        <select
                          {...degreeForm.register(`values.${level}.intake_year`, {
                            setValueAs: (value) => Number(value),
                          })}
                        >
                          <option value="">Select</option>
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Graduation year">
                        <select
                          {...degreeForm.register(`values.${level}.graduation_year`, {
                            setValueAs: (value) => Number(value),
                          })}
                        >
                          <option value="">Select</option>
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          {degreeForm.formState.errors.values ? <p className="text-xs text-destructive">Please review degree fields.</p> : null}
          <div className="flex items-center justify-between border-t border-border-muted pt-4">
            <p className="text-xs text-foreground-lighter">At least one degree is required.</p>
            <SaveButton />
          </div>
        </form>
      </section>

      {/* ─── Employment ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <div className="mb-4 border-b border-border-muted pb-4">
          <h3 className="text-base font-medium text-foreground">Employment</h3>
          <p className="mt-0.5 text-sm text-foreground-light">Your positions and career timeline.</p>
        </div>
        <div className="flex flex-col gap-3">
          {employmentList.map((item) => (
            <div className="flex items-start justify-between rounded-md border border-border-muted bg-surface-200 p-4 transition-colors hover:border-border-secondary" key={item.id}>
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-300 text-xs font-medium text-foreground-light">
                  {item.company.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.job_title}</p>
                  <p className="mt-0.5 text-xs text-foreground-light">{item.company}</p>
                </div>
              </div>
              <button
                className="rounded-md p-1.5 text-foreground-lighter transition-colors hover:bg-destructive/10 hover:text-destructive"
                onClick={async () => {
                  await deleteEmployment(item.id);
                  setEmploymentList((current) => current.filter((entry) => entry.id !== item.id));
                  toast.success('Removed');
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {employmentList.length === 0 ? (
            <div className="flex flex-col items-center rounded-md border border-border-muted bg-surface-200 p-8 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-300 text-foreground-lighter">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No employment added yet</p>
              <p className="mt-1 text-xs text-foreground-lighter">
                Add your most recent role so alumni can find you.
              </p>
            </div>
          ) : null}
          <button
            className="w-full rounded-md border border-dashed border-border-secondary py-2.5 text-sm font-medium text-foreground-lighter transition-colors hover:border-border-strong hover:bg-surface-200 hover:text-foreground-light"
            onClick={async () => {
              const draft = {
                job_title: 'New role',
                company: 'Company',
                employment_type: null,
                start_month: `${new Date().getFullYear()}-01`,
                end_month: null,
                city: null,
                country: null,
                description: null,
              };
              await createEmployment(draft);
              toast.success('Position added');
            }}
            type="button"
          >
            + Add position
          </button>
        </div>
      </section>

      {/* ─── Skills ─────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <div className="mb-4 border-b border-border-muted pb-4">
          <h3 className="text-base font-medium text-foreground">Skills</h3>
          <p className="mt-0.5 text-sm text-foreground-light">Select up to 20 skills or areas of expertise.</p>
        </div>
        {skills.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                className="inline-flex items-center gap-1 rounded bg-surface-300 px-2.5 py-1 text-xs text-foreground-light"
                key={skill}
              >
                {skill}
                <button
                  className="text-foreground-lighter transition-colors hover:text-foreground"
                  onClick={() => setSkills((current) => current.filter((entry) => entry !== skill))}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            onChange={(event) => {
              const query = event.target.value;
              setSkillQuery(query);
              void querySkills(query);
            }}
            placeholder="Search or create skill…"
            value={skillQuery}
          />
          {skillQuery ? (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface-200 py-1 shadow-none">
              {skillOptions.map((option) => (
                <button
                  className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-300"
                  key={option}
                  onClick={() => {
                    if (skills.length < 20 && !skills.includes(option)) {
                      setSkills((current) => [...current, option]);
                    }
                    setSkillQuery('');
                  }}
                  type="button"
                >
                  {option}
                </button>
              ))}
              <button
                className="block w-full px-3 py-2 text-left text-sm text-brand transition-colors hover:bg-surface-300"
                onClick={() => {
                  if (skills.length < 20 && skillQuery && !skills.includes(skillQuery)) {
                    setSkills((current) => [...current, skillQuery]);
                  }
                  setSkillQuery('');
                }}
                type="button"
              >
                + Create &quot;{skillQuery}&quot;
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border-muted pt-4">
          <p className="text-xs text-foreground-lighter">{skills.length}/20 skills selected.</p>
          <SaveButton
            type="button"
            onClick={async () => {
              try {
                await saveSkills(skills);
                toast.success('Saved');
              } catch {
                toast.error('Could not save');
              }
            }}
          />
        </div>
      </section>

      {/* ─── Privacy ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-surface-100 p-5">
        <div className="mb-4 border-b border-border-muted pb-4">
          <h3 className="text-base font-medium text-foreground">Privacy</h3>
          <p className="mt-0.5 text-sm text-foreground-light">Control who sees your data.</p>
        </div>
        <form
          className="flex flex-col"
          onSubmit={privacyForm.handleSubmit(async (values) => {
            try {
              await savePrivacySettings(values);
              toast.success('Saved');
            } catch {
              toast.error('Could not save');
            }
          })}
        >
          {privacyRows.map(({ field, label, options }) => (
            <div className="flex items-center justify-between border-b border-border-muted py-3 last:border-b-0" key={field}>
              <span className="text-sm text-foreground-light">{label}</span>
              <select className="!w-[180px] border border-border-control bg-surface-200 text-sm" {...privacyForm.register(field)}>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="mt-4 flex items-center justify-between border-t border-border-muted pt-4">
            <p className="text-xs text-foreground-lighter">Privacy changes take effect within 60 seconds.</p>
            <SaveButton />
          </div>
        </form>
      </section>
    </div>
  );
}
