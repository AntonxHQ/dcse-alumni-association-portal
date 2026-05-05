'use client';

import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

const DEGREE_META: Record<'BS' | 'MS' | 'PhD', { label: string; duration: string }> = {
    BS: { label: 'Bachelor of Science', duration: '4-year undergraduate' },
    MS: { label: 'Master of Science', duration: '2-year postgraduate' },
    PhD: { label: 'Doctor of Philosophy', duration: 'Research doctorate' },
};

export function DegreesStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const currentYear = new Date().getFullYear();

    // BS batches: Batch 1 = 1999, Batch N = 1998 + N
    const batches = useMemo(
        () => Array.from({ length: currentYear - 1998 }, (_, i) => i + 1),
        [currentYear],
    );

    // MS/PhD intake years: 1999 → currentYear
    const intakeYears = useMemo(
        () => Array.from({ length: currentYear - 1998 }, (_, i) => 1999 + i),
        [currentYear],
    );

    const selectedLevels = useWatch({
        control: form.control,
        name: 'selectedLevels',
        defaultValue: [],
    });

    function toggleLevel(level: 'BS' | 'MS' | 'PhD', checked: boolean) {
        const current = form.getValues('selectedLevels');
        if (checked) {
            form.setValue('selectedLevels', [...current, level], { shouldValidate: true });
        } else {
            form.setValue(
                'selectedLevels',
                current.filter((l) => l !== level),
                { shouldValidate: true },
            );
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground-light">
                Select the degree(s) you completed at the CSE department and fill in your details.
            </p>

            {form.formState.errors.selectedLevels && (
                <p className="text-xs text-destructive">{form.formState.errors.selectedLevels.message}</p>
            )}

            <div className="flex flex-col gap-3">
                {(['BS', 'MS', 'PhD'] as const).map((level) => {
                    const checked = selectedLevels.includes(level);
                    const meta = DEGREE_META[level];
                    const isBS = level === 'BS';

                    return (
                        <div
                            className={`rounded-lg border transition-colors ${checked ? 'border-brand bg-brand/5' : 'border-border-muted bg-surface-100'}`}
                            key={level}
                        >
                            {/* Degree selector row */}
                            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                                <input
                                    checked={checked}
                                    className="h-4 w-4 accent-brand"
                                    onChange={(e) => toggleLevel(level, e.target.checked)}
                                    type="checkbox"
                                />
                                <div className="flex flex-1 items-center justify-between">
                                    <div>
                                        <span className="text-sm font-semibold text-foreground">{level}</span>
                                        <span className="ml-2 text-sm text-foreground-light">{meta.label}</span>
                                    </div>
                                    <span className="text-xs text-foreground-lighter">{meta.duration}</span>
                                </div>
                            </label>

                            {/* Degree details — shown when checked */}
                            {checked && (
                                <div className="border-t border-border-muted px-4 pb-4 pt-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {/* Registration Number */}
                                        <div>
                                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">
                                                Registration No. <span className="text-destructive">*</span>
                                            </span>
                                            <input
                                                {...form.register(`degreeValues.${level}.registration_no`)}
                                                placeholder="15PWCSE1281"
                                            />
                                            <p className="mt-0.5 text-xs text-foreground-lighter">
                                                As printed on your degree certificate
                                            </p>
                                        </div>

                                        {isBS ? (
                                            /* BS — Batch number only (no year) */
                                            <div>
                                                <span className="mb-1.5 block text-sm font-medium text-foreground-light">
                                                    Batch <span className="text-destructive">*</span>
                                                </span>
                                                <select
                                                    {...form.register(`degreeValues.${level}.batch_no`, {
                                                        setValueAs: (v) => (v ? Number(v) : undefined),
                                                    })}
                                                >
                                                    <option value="">Select batch</option>
                                                    {batches.map((batch) => (
                                                        <option key={batch} value={batch}>
                                                            Batch {batch}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="mt-0.5 text-xs text-foreground-lighter">
                                                    Your undergraduate batch number
                                                </p>
                                            </div>
                                        ) : (
                                            /* MS / PhD — Intake year */
                                            <div>
                                                <span className="mb-1.5 block text-sm font-medium text-foreground-light">
                                                    Intake year{' '}
                                                    <span className="ml-1 text-xs font-normal text-foreground-lighter">(optional)</span>
                                                </span>
                                                <select
                                                    value={
                                                        form.watch(`degreeValues.${level}.batch_no`)
                                                            ? String(1998 + (form.watch(`degreeValues.${level}.batch_no`) as number))
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        const year = Number(e.target.value);
                                                        form.setValue(
                                                            `degreeValues.${level}.batch_no`,
                                                            year ? year - 1998 : undefined,
                                                        );
                                                    }}
                                                >
                                                    <option value="">Select year</option>
                                                    {intakeYears.map((year) => (
                                                        <option key={year} value={year}>
                                                            {year}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="mt-0.5 text-xs text-foreground-lighter">
                                                    Year you started this degree
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
