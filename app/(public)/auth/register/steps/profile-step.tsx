'use client';

import type { UseFormReturn } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

import { City, Country } from 'country-state-city';

export function ProfileStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const selectedCountryCode = form.watch('country');
    const countries = Country.getAllCountries();
    const cities = selectedCountryCode ? City.getCitiesOfCountry(selectedCountryCode) : [];

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground-light">
                Add more details to your profile. All fields here are optional.
            </p>

            <div className="grid grid-cols-2 gap-4">
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
                    <input {...form.register('postal_address')} placeholder="123 Example Street" />
                </div>
            </div>

            <div className="rounded-md border border-border bg-surface-100 p-4">
                <h4 className="mb-4 text-sm font-medium text-foreground">Current city and country of residence</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="mb-1.5 block text-sm font-medium text-foreground-light">Country</span>
                        <select
                            {...form.register('country')}
                            className="w-full bg-surface-200"
                            onChange={(e) => {
                                form.setValue('country', e.target.value);
                                form.setValue('city', ''); // Reset city on country change
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
                            {...form.register('city')}
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

            <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground-light">Bio</span>
                <textarea
                    {...form.register('bio')}
                    placeholder="A short bio about yourself (max 300 chars)"
                    rows={3}
                />
            </div>
        </div>
    );
}
