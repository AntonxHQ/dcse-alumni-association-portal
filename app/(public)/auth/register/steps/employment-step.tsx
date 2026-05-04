'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

const employmentTypes = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'self_employed', label: 'Self-employed' },
];

export function EmploymentStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'employment',
    });

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground-light">
                Add your employment history. You can skip this step and add it later.
            </p>

            {fields.map((field, index) => (
                <div className="rounded-md border border-border-muted bg-surface-200 p-4" key={field.id}>
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Position {index + 1}</span>
                        <button
                            className="rounded-md p-1.5 text-foreground-lighter transition-colors hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => remove(index)}
                            type="button"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Job title</span>
                            <input {...form.register(`employment.${index}.job_title`)} placeholder="Software Engineer" />
                        </div>
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Company</span>
                            <input {...form.register(`employment.${index}.company`)} placeholder="Company name" />
                        </div>
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Type</span>
                            <select {...form.register(`employment.${index}.employment_type`)}>
                                <option value="">Select</option>
                                {employmentTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Start date</span>
                            <input {...form.register(`employment.${index}.start_month`)} placeholder="2023-01" type="month" />
                        </div>
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">End date</span>
                            <input {...form.register(`employment.${index}.end_month`)} placeholder="Present" type="month" />
                            <p className="mt-0.5 text-xs text-foreground-lighter">Leave empty for current role</p>
                        </div>
                    </div>
                </div>
            ))}

            <button
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-secondary py-2.5 text-sm font-medium text-foreground-lighter transition-colors hover:border-border-strong hover:bg-surface-200 hover:text-foreground-light"
                onClick={() =>
                    append({
                        job_title: '',
                        company: '',
                        employment_type: '',
                        start_month: '',
                        end_month: '',
                    })
                }
                type="button"
            >
                <Plus className="h-4 w-4" />
                Add position
            </button>
        </div>
    );
}
