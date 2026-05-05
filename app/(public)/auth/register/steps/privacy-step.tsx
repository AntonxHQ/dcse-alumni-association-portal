'use client';

import { Lock, Shield, Users } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

const privacyFields: Array<{
    field: 'privacy_email' | 'privacy_phone' | 'privacy_postal_address' | 'privacy_city' | 'privacy_employment';
    label: string;
    description: string;
}> = [
        { field: 'privacy_email', label: 'Email address', description: 'Who can see your email' },
        { field: 'privacy_phone', label: 'Phone number', description: 'Who can see your phone' },
        { field: 'privacy_postal_address', label: 'Postal address', description: 'Who can see your address' },
        { field: 'privacy_city', label: 'City & country', description: 'Who can see your location' },
        { field: 'privacy_employment', label: 'Employment history', description: 'Who can see your career info' },
    ];

const PRIVACY_OPTIONS = [
    {
        value: 'alumni_only',
        label: 'Alumni only',
        icon: <Users className="h-3.5 w-3.5" />,
        description: 'Visible to verified alumni',
    },
    {
        value: 'private',
        label: 'Private',
        icon: <Lock className="h-3.5 w-3.5" />,
        description: 'Only visible to you',
    },
];

function PrivacyToggle({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    return (
        <div className="flex overflow-hidden rounded-md border border-border-control">
            {PRIVACY_OPTIONS.map((opt) => (
                <button
                    className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                        value === opt.value
                            ? 'bg-brand text-foreground-contrast'
                            : 'bg-surface-200 text-foreground-lighter hover:bg-surface-300 hover:text-foreground-light'
                    }`}
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    title={opt.description}
                    type="button"
                >
                    {opt.icon}
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export function PrivacyStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start gap-3 rounded-lg border border-border-muted bg-surface-100 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10">
                    <Shield className="h-4.5 w-4.5 text-brand" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">Control your privacy</p>
                    <p className="mt-0.5 text-xs text-foreground-light">
                        Choose who can see each piece of your profile. You can update these any time from your settings.
                    </p>
                </div>
            </div>

            {/* Privacy toggles */}
            <div className="rounded-lg border border-border-muted bg-surface-100">
                {privacyFields.map(({ field, label, description }, index) => (
                    <div
                        className={`flex items-center justify-between gap-4 px-4 py-3 ${
                            index < privacyFields.length - 1 ? 'border-b border-border-muted' : ''
                        }`}
                        key={field}
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-foreground-lighter">{description}</p>
                        </div>
                        <div className="shrink-0">
                            <PrivacyToggle
                                onChange={(val) => form.setValue(field, val)}
                                value={form.watch(field) || 'alumni_only'}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Consent */}
            <div>
                <h4 className="mb-1 text-sm font-medium text-foreground">Agreements</h4>
                <p className="mb-3 text-xs text-foreground-light">
                    Please accept the following to complete your profile.
                </p>

                <div className="flex flex-col gap-3">
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border-muted bg-surface-100 px-3.5 py-3 transition-colors hover:bg-surface-200">
                        <input
                            {...form.register('consent_data_storage')}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                            type="checkbox"
                        />
                        <div>
                            <p className="text-sm font-medium text-foreground">Data storage & processing</p>
                            <p className="mt-0.5 text-xs text-foreground-light">
                                I agree to the storage and processing of my personal data in accordance with the data storage policy.
                            </p>
                        </div>
                    </label>
                    {form.formState.errors.consent_data_storage && (
                        <p className="text-xs text-destructive">{form.formState.errors.consent_data_storage.message}</p>
                    )}

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border-muted bg-surface-100 px-3.5 py-3 transition-colors hover:bg-surface-200">
                        <input
                            {...form.register('consent_communications')}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                            type="checkbox"
                        />
                        <div>
                            <p className="text-sm font-medium text-foreground">Email communications <span className="text-xs font-normal text-foreground-lighter">(optional)</span></p>
                            <p className="mt-0.5 text-xs text-foreground-light">
                                I want to receive email updates about alumni events and department news.
                            </p>
                        </div>
                    </label>

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border-muted bg-surface-100 px-3.5 py-3 transition-colors hover:bg-surface-200">
                        <input
                            {...form.register('consent_directory')}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                            type="checkbox"
                        />
                        <div>
                            <p className="text-sm font-medium text-foreground">Alumni directory listing</p>
                            <p className="mt-0.5 text-xs text-foreground-light">
                                I consent to having my profile listed in the alumni directory (subject to my privacy settings above).
                            </p>
                        </div>
                    </label>
                    {form.formState.errors.consent_directory && (
                        <p className="text-xs text-destructive">{form.formState.errors.consent_directory.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
