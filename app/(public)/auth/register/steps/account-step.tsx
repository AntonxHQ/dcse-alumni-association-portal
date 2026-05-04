'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { RegistrationFormData } from '../schema';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-warning' };
    if (score === 3) return { score, label: 'Good', color: 'bg-brand-400' };
    return { score, label: 'Strong', color: 'bg-brand' };
}

export function AccountStep({ form }: { form: UseFormReturn<RegistrationFormData> }) {
    const [showPassword, setShowPassword] = useState(false);
    const password = form.watch('password');
    const strength = getPasswordStrength(password || '');

    return (
        <div className="flex flex-col gap-4">
            <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground-light">Full name</span>
                <input
                    {...form.register('full_name')}
                    placeholder="e.g. Ahmed Khan"
                    type="text"
                />
                {form.formState.errors.full_name && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                )}
            </div>

            <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground-light">Email</span>
                <input
                    {...form.register('email')}
                    placeholder="you@example.com"
                    type="email"
                />
                {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
            </div>

            <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground-light">Password</span>
                <div className="relative">
                    <input
                        {...form.register('password')}
                        placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                        type={showPassword ? 'text' : 'password'}
                    />
                    <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-lighter hover:text-foreground-light"
                        onClick={() => setShowPassword((v) => !v)}
                        type="button"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {password && password.length > 0 && (
                    <div className="mt-2">
                        <div className="flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-surface-300'}`}
                                    key={i}
                                />
                            ))}
                        </div>
                        <p className="mt-1 text-xs text-foreground-lighter">{strength.label}</p>
                    </div>
                )}
                {form.formState.errors.password && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
            </div>
        </div>
    );
}
