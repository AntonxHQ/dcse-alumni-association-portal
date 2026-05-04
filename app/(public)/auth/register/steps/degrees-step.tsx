'use client';

import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

export function DegreesStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const years = useMemo(
        () => Array.from({ length: new Date().getFullYear() - 1979 + 1 }, (_, i) => 1980 + i),
        [],
    );

    const selectedLevels = useWatch({
        control: form.control,
        name: 'selectedLevels',
        defaultValue: [],
    });

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground-light">
                Select at least one degree you completed at the CSE department.
            </p>

            {form.formState.errors.selectedLevels && (
                <p className="text-xs text-destructive">{form.formState.errors.selectedLevels.message}</p>
            )}

            {(['BS', 'MS', 'PhD'] as const).map((level) => {
                const checked = selectedLevels.includes(level);
                return (
                    <div key={level}>
                        <label className="flex items-center gap-2.5 text-sm font-medium text-foreground-light">
                            <input
                                checked={checked}
                                className="h-4 w-4 accent-brand"
                                onChange={(event) => {
                                    const current = form.getValues('selectedLevels');
                                    if (event.target.checked) {
                                        form.setValue('selectedLevels', [...current, level], { shouldValidate: true });
                                    } else {
                                        form.setValue(
                                            'selectedLevels',
                                            current.filter((entry) => entry !== level),
                                            { shouldValidate: true },
                                        );
                                    }
                                }}
                                type="checkbox"
                            />
                            {level}
                        </label>

                        {checked && (
                            <div className="mt-3 rounded-md border border-border-muted bg-surface-200 p-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <span className="mb-1.5 block text-sm font-medium text-foreground-light">Registration no.</span>
                                        <input
                                            {...form.register(`degreeValues.${level}.registration_no`)}
                                            placeholder="2020-CSE-0001"
                                        />
                                    </div>
                                    <div>
                                        <span className="mb-1.5 block text-sm font-medium text-foreground-light">Intake year</span>
                                        <select
                                            {...form.register(`degreeValues.${level}.intake_year`, {
                                                setValueAs: (v) => (v ? Number(v) : 0),
                                            })}
                                        >
                                            <option value="">Select</option>
                                            {years.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <span className="mb-1.5 block text-sm font-medium text-foreground-light">Graduation year</span>
                                        <select
                                            {...form.register(`degreeValues.${level}.graduation_year`, {
                                                setValueAs: (v) => (v ? Number(v) : 0),
                                            })}
                                        >
                                            <option value="">Select</option>
                                            {years.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
