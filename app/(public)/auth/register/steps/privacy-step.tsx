'use client';

import type { UseFormReturn } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

const privacyRows: Array<{
    field: 'privacy_email' | 'privacy_phone' | 'privacy_postal_address' | 'privacy_city' | 'privacy_employment';
    label: string;
    options: Array<{ value: string; label: string }>;
}> = [
        {
            field: 'privacy_email',
            label: 'Email',
            options: [
                { value: 'alumni_only', label: 'Alumni only' },
                { value: 'private', label: 'Private' },
            ],
        },
        {
            field: 'privacy_phone',
            label: 'Phone',
            options: [
                { value: 'alumni_only', label: 'Alumni only' },
                { value: 'private', label: 'Private' },
            ],
        },
        {
            field: 'privacy_postal_address',
            label: 'Postal address',
            options: [
                { value: 'alumni_only', label: 'Alumni only' },
                { value: 'private', label: 'Private' },
            ],
        },
        {
            field: 'privacy_city',
            label: 'City',
            options: [
                { value: 'public', label: 'Public' },
                { value: 'alumni_only', label: 'Alumni only' },
                { value: 'private', label: 'Private' },
            ],
        },
        {
            field: 'privacy_employment',
            label: 'Employment',
            options: [
                { value: 'public', label: 'Public' },
                { value: 'alumni_only', label: 'Alumni only' },
            ],
        },
    ];

export function PrivacyStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h4 className="text-sm font-medium text-foreground">Privacy settings</h4>
                <p className="mt-0.5 text-sm text-foreground-light">
                    Control who can see each piece of your profile data.
                </p>
            </div>

            <div className="rounded-md border border-border-muted bg-surface-200">
                {privacyRows.map(({ field, label, options }, index) => (
                    <div
                        className={`flex items-center justify-between px-4 py-3 ${index < privacyRows.length - 1 ? 'border-b border-border-muted' : ''}`}
                        key={field}
                    >
                        <span className="text-sm text-foreground-light">{label}</span>
                        <select
                            className="!w-[160px] border border-border-control bg-surface-300 text-sm"
                            {...form.register(field)}
                        >
                            {options.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            <div className="mt-2">
                <h4 className="text-sm font-medium text-foreground">Consent</h4>
                <p className="mt-0.5 mb-3 text-sm text-foreground-light">
                    Please review and accept the following to complete registration.
                </p>

                <div className="flex flex-col gap-3">
                    <label className="flex items-start gap-2.5 text-sm text-foreground-light">
                        <input
                            {...form.register('consent_data_storage')}
                            className="mt-0.5 h-4 w-4 accent-brand"
                            type="checkbox"
                        />
                        <span>
                            I agree to the storage and processing of my personal data in accordance with the
                            data storage policy.
                        </span>
                    </label>
                    {form.formState.errors.consent_data_storage && (
                        <p className="ml-6 text-xs text-destructive">{form.formState.errors.consent_data_storage.message}</p>
                    )}

                    <label className="flex items-start gap-2.5 text-sm text-foreground-light">
                        <input
                            {...form.register('consent_communications')}
                            className="mt-0.5 h-4 w-4 accent-brand"
                            type="checkbox"
                        />
                        <span>
                            I opt in to receive email communications about alumni events and updates.
                        </span>
                    </label>

                    <label className="flex items-start gap-2.5 text-sm text-foreground-light">
                        <input
                            {...form.register('consent_directory')}
                            className="mt-0.5 h-4 w-4 accent-brand"
                            type="checkbox"
                        />
                        <span>
                            I consent to having my profile listed in the alumni directory (subject to my privacy settings above).
                        </span>
                    </label>
                    {form.formState.errors.consent_directory && (
                        <p className="ml-6 text-xs text-destructive">{form.formState.errors.consent_directory.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
