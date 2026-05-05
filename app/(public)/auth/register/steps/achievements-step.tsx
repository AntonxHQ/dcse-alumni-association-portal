'use client';

import { Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

const PREDEFINED_SKILLS = [
    'Embedded Systems', 'VLSI Design', 'Computer Networks', 'Machine Learning',
    'Operating Systems', 'PCB Design', 'IoT', 'Cybersecurity',
    'Software Engineering', 'Digital Signal Processing', 'Python', 'C/C++',
    'Java', 'Web Development', 'Mobile Development', 'Cloud Computing',
    'Database Design', 'Computer Vision', 'Natural Language Processing', 'Robotics',
];

export function AchievementsStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'achievements',
    });

    const currentYear = new Date().getFullYear();
    const years = useMemo(
        () => Array.from({ length: currentYear - 1994 }, (_, i) => currentYear - i),
        [currentYear],
    );

    // Skills state
    const [skillQuery, setSkillQuery] = useState('');
    const skills = form.watch('skills') ?? [];

    const filteredSkills = skillQuery
        ? PREDEFINED_SKILLS.filter(
            (s) => s.toLowerCase().includes(skillQuery.toLowerCase()) && !skills.includes(s),
        )
        : [];

    function addSkill(skill: string) {
        const trimmed = skill.trim();
        if (!trimmed || skills.length >= 20 || skills.includes(trimmed)) return;
        form.setValue('skills', [...skills, trimmed]);
        setSkillQuery('');
    }

    function removeSkill(skill: string) {
        form.setValue('skills', skills.filter((s) => s !== skill));
    }

    return (
        <div className="flex flex-col gap-6">

            {/* ── Achievements ─────────────────────────────────── */}
            <div>
                <h4 className="mb-1 text-sm font-semibold text-foreground">Achievements</h4>
                <p className="mb-3 text-xs text-foreground-lighter">
                    Awards, publications, patents, certifications, and other milestones.
                </p>

                {fields.length === 0 && (
                    <div className="mb-3 rounded-lg border border-dashed border-border-secondary py-6 text-center">
                        <p className="text-sm text-foreground-lighter">No achievements added yet.</p>
                    </div>
                )}

                {fields.map((field, index) => (
                    <div className="mb-3 rounded-lg border border-border-muted bg-surface-200 p-4" key={field.id}>
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wide text-foreground-lighter">Achievement {index + 1}</span>
                            <button
                                className="rounded-md p-1.5 text-foreground-lighter transition-colors hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => remove(index)}
                                type="button"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="sm:col-span-2">
                                    <span className="mb-1.5 block text-sm font-medium text-foreground-light">
                                        Title <span className="text-destructive">*</span>
                                    </span>
                                    <input
                                        {...form.register(`achievements.${index}.title`)}
                                        placeholder="e.g. Best Paper Award, AWS Certification"
                                    />
                                </div>
                                <div>
                                    <span className="mb-1.5 block text-sm font-medium text-foreground-light">
                                        Year <span className="text-xs font-normal text-foreground-lighter">(optional)</span>
                                    </span>
                                    <select
                                        {...form.register(`achievements.${index}.year`, {
                                            setValueAs: (v) => (v ? Number(v) : undefined),
                                        })}
                                    >
                                        <option value="">Select year</option>
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-foreground-light">
                                    Description <span className="text-xs font-normal text-foreground-lighter">(optional)</span>
                                </span>
                                <textarea
                                    {...form.register(`achievements.${index}.description`)}
                                    className="resize-none"
                                    placeholder="Brief description…"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-secondary py-2.5 text-sm font-medium text-foreground-lighter transition-colors hover:border-border-strong hover:bg-surface-200 hover:text-foreground-light"
                    onClick={() => append({ title: '', year: undefined, description: '' })}
                    type="button"
                >
                    <Plus className="h-4 w-4" />
                    Add achievement
                </button>
            </div>

            {/* ── Skills ───────────────────────────────────────── */}
            <div className="border-t border-border-muted pt-5">
                <h4 className="mb-1 text-sm font-semibold text-foreground">Skills</h4>
                <p className="mb-3 text-xs text-foreground-lighter">
                    Select up to 20 technical skills or areas of expertise.
                </p>

                {skills.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <span
                                className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                                key={skill}
                            >
                                {skill}
                                <button
                                    className="text-brand/60 transition-colors hover:text-brand"
                                    onClick={() => removeSkill(skill)}
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
                        onChange={(e) => setSkillQuery(e.target.value)}
                        placeholder="Search or type a skill…"
                        value={skillQuery}
                    />
                    {skillQuery && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface-200 py-1 shadow-sm">
                            {filteredSkills.map((skill) => (
                                <button
                                    className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-300"
                                    key={skill}
                                    onClick={() => addSkill(skill)}
                                    type="button"
                                >
                                    {skill}
                                </button>
                            ))}
                            {!filteredSkills.find((s) => s.toLowerCase() === skillQuery.toLowerCase()) && (
                                <button
                                    className="block w-full px-3 py-2 text-left text-sm text-brand transition-colors hover:bg-surface-300"
                                    onClick={() => addSkill(skillQuery)}
                                    type="button"
                                >
                                    + Add &quot;{skillQuery}&quot;
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <p className="mt-1.5 text-xs text-foreground-lighter">{skills.length}/20 skills selected</p>
            </div>
        </div>
    );
}
