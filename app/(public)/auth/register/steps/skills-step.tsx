'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

const PREDEFINED_SKILLS = [
    'Embedded Systems',
    'VLSI Design',
    'Computer Networks',
    'Machine Learning',
    'Operating Systems',
    'PCB Design',
    'IoT',
    'Cybersecurity',
    'Software Engineering',
    'Digital Signal Processing',
];

export function SkillsStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const [query, setQuery] = useState('');
    const skills = form.watch('skills') ?? [];

    const filtered = query
        ? PREDEFINED_SKILLS.filter(
            (s) =>
                s.toLowerCase().includes(query.toLowerCase()) && !skills.includes(s),
        )
        : [];

    const addSkill = (skill: string) => {
        if (skills.length < 20 && !skills.includes(skill)) {
            form.setValue('skills', [...skills, skill]);
        }
        setQuery('');
    };

    const removeSkill = (skill: string) => {
        form.setValue('skills', skills.filter((s) => s !== skill));
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground-light">
                Select up to 20 skills or areas of expertise. You can skip this step.
            </p>

            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <span
                            className="inline-flex items-center gap-1 rounded bg-surface-300 px-2.5 py-1 text-xs text-foreground-light"
                            key={skill}
                        >
                            {skill}
                            <button
                                className="text-foreground-lighter transition-colors hover:text-foreground"
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
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search or type a skill…"
                    value={query}
                />
                {query && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface-200 py-1">
                        {filtered.map((skill) => (
                            <button
                                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-300"
                                key={skill}
                                onClick={() => addSkill(skill)}
                                type="button"
                            >
                                {skill}
                            </button>
                        ))}
                        {!filtered.find((s) => s.toLowerCase() === query.toLowerCase()) && (
                            <button
                                className="block w-full px-3 py-2 text-left text-sm text-brand transition-colors hover:bg-surface-300"
                                onClick={() => addSkill(query.trim())}
                                type="button"
                            >
                                + Create &quot;{query}&quot;
                            </button>
                        )}
                    </div>
                )}
            </div>

            <p className="text-xs text-foreground-lighter">{skills.length}/20 skills selected.</p>
        </div>
    );
}
