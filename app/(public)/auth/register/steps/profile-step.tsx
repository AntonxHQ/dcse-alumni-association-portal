'use client';

import { Camera } from 'lucide-react';
import { City, Country } from 'country-state-city';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { SearchableSelect } from '../../../../../components/ui/searchable-select';
import type { RegistrationFormData } from '../schema';

export function ProfileStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const selectedCountryCode = form.watch('country');

    const countryOptions = useMemo(
        () => Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name })),
        [],
    );

    const cityOptions = useMemo(() => {
        if (!selectedCountryCode) return [];
        return (City.getCitiesOfCountry(selectedCountryCode) ?? []).map((c) => ({
            value: c.name,
            label: c.name,
        }));
    }, [selectedCountryCode]);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fullName = form.watch('full_name') || '';
    const initials = fullName.split(' ').map((p: string) => p[0] ?? '').join('').slice(0, 2).toUpperCase();

    const [avatarError, setAvatarError] = useState<string | null>(null);

    async function handleAvatarChange(file: File) {
        setAvatarError(null);
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            setAvatarError('Only JPEG and PNG files are allowed');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setAvatarError('File size must be 10 MB or less');
            return;
        }
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
            const json = await res.json() as { url?: string; error?: string };
            if (res.ok && json.url) {
                setAvatarUrl(json.url);
            } else {
                setAvatarError(json.error ?? 'Upload failed');
            }
        } finally {
            setAvatarUploading(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground-light">
                All fields here are optional — you can always update your profile later.
            </p>

            {/* Avatar */}
            <div className="flex items-center gap-4 rounded-lg border border-border-muted bg-surface-100 p-4">
                {avatarUrl ? (
                    <Image alt="Avatar" className="h-16 w-16 rounded-full object-cover" height={64} src={avatarUrl} unoptimized width={64} />
                ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-300 text-lg font-medium text-foreground-light">
                        {initials || '?'}
                    </div>
                )}
                <div>
                    <p className="mb-1.5 text-sm font-medium text-foreground">Profile photo</p>
                    <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-secondary bg-button px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-strong hover:bg-surface-300 ${avatarUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                        <Camera className="h-3.5 w-3.5" />
                        {avatarUploading ? 'Uploading…' : 'Upload photo'}
                        <input
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatarChange(f); }}
                            type="file"
                        />
                    </label>
                    <p className="mt-1 text-xs text-foreground-lighter">JPEG or PNG, max 10 MB</p>
                    {avatarError && <p className="mt-1 text-xs text-destructive">{avatarError}</p>}
                </div>
            </div>

            {/* Bio — at the top for prominence */}
            <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground-light">Bio</span>
                <textarea
                    {...form.register('bio')}
                    className="resize-none"
                    maxLength={300}
                    placeholder="A short intro about yourself — your background, interests, or what you're working on. (max 300 characters)"
                    rows={3}
                />
                <p className="mt-0.5 text-right text-xs text-foreground-lighter">
                    {(form.watch('bio') || '').length}/300
                </p>
            </div>

            {/* Location */}
            <div className="rounded-md border border-border bg-surface-100 p-4">
                <h4 className="mb-3 text-sm font-medium text-foreground">Current location</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <span className="mb-1.5 block text-sm font-medium text-foreground-light">Country</span>
                        <SearchableSelect
                            onChange={(val) => {
                                form.setValue('country', val, { shouldDirty: true });
                                form.setValue('city', '');
                            }}
                            options={countryOptions}
                            placeholder="Select country"
                            value={selectedCountryCode ?? ''}
                        />
                    </div>
                    <div>
                        <span className="mb-1.5 block text-sm font-medium text-foreground-light">City</span>
                        <SearchableSelect
                            disabled={!selectedCountryCode || cityOptions.length === 0}
                            onChange={(val) => form.setValue('city', val, { shouldDirty: true })}
                            options={cityOptions}
                            placeholder={!selectedCountryCode ? 'Select country first' : cityOptions.length === 0 ? 'No cities available' : 'Select city'}
                            value={form.watch('city') ?? ''}
                        />
                    </div>
                </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <span className="mb-1.5 block text-sm font-medium text-foreground-light">Phone</span>
                    <input
                        {...form.register('phone')}
                        placeholder="+923001234567"
                        type="tel"
                    />
                </div>
                <div>
                    <span className="mb-1.5 block text-sm font-medium text-foreground-light">Postal address</span>
                    <input {...form.register('postal_address')} placeholder="Street, City, Country" />
                </div>
            </div>
        </div>
    );
}
