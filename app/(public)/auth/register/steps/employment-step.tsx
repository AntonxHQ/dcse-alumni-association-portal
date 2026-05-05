'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const employmentTypes = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'self_employed', label: 'Self-employed' },
];

/* ─── Month-Year picker ──────────────────────────────────────── */

function MonthYearPicker({
    value,
    onChange,
    placeholder,
}: {
    value: string; // "YYYY-MM"
    onChange: (val: string) => void;
    placeholder?: string;
}) {
    const currentYear = new Date().getFullYear();
    const years = useMemo(
        () => Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i),
        [currentYear],
    );

    const [yearPart, monthPart] = value ? value.split('-') : ['', ''];

    function handleYear(y: string) {
        onChange(y && monthPart ? `${y}-${monthPart}` : y ? `${y}-01` : '');
    }

    function handleMonth(m: string) {
        if (!yearPart) return;
        onChange(m ? `${yearPart}-${m}` : '');
    }

    return (
        <div className="flex gap-2">
            <select
                className="flex-[2]"
                onChange={(e) => handleYear(e.target.value)}
                value={yearPart || ''}
            >
                <option value="">{placeholder ?? 'Year'}</option>
                {years.map((y) => (
                    <option key={y} value={y}>
                        {y}
                    </option>
                ))}
            </select>
            <select
                className="flex-[3]"
                disabled={!yearPart}
                onChange={(e) => handleMonth(e.target.value)}
                value={monthPart || ''}
            >
                <option value="">Month</option>
                {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                        {m.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/* ─── Employment step ────────────────────────────────────────── */

export function EmploymentStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'employment',
    });

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground-light">
                Add your employment history. You can skip this step and add it later from your profile.
            </p>

            {fields.map((field, index) => (
                <div className="rounded-lg border border-border-muted bg-surface-200 p-4" key={field.id}>
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Job title</span>
                            <input {...form.register(`employment.${index}.job_title`)} placeholder="e.g. Software Engineer" />
                        </div>
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Company</span>
                            <input {...form.register(`employment.${index}.company`)} placeholder="Company or organization" />
                        </div>
                        <div className="sm:col-span-2">
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Employment type</span>
                            <select {...form.register(`employment.${index}.employment_type`)}>
                                <option value="">Select type</option>
                                {employmentTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">Start date</span>
                            <MonthYearPicker
                                onChange={(val) => form.setValue(`employment.${index}.start_month`, val)}
                                placeholder="Start year"
                                value={form.watch(`employment.${index}.start_month`) || ''}
                            />
                        </div>
                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-foreground-light">End date</span>
                            <MonthYearPicker
                                onChange={(val) => form.setValue(`employment.${index}.end_month`, val)}
                                placeholder="End year"
                                value={form.watch(`employment.${index}.end_month`) || ''}
                            />
                            <p className="mt-0.5 text-xs text-foreground-lighter">Leave empty if this is your current role</p>
                        </div>
                    </div>
                </div>
            ))}

            <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-secondary py-3 text-sm font-medium text-foreground-lighter transition-colors hover:border-border-strong hover:bg-surface-200 hover:text-foreground-light"
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
