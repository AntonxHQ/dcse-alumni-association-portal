'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
    completeStep1,
    completeStep2,
    completeStep3,
    completeStep4,
    completeStep5,
    completeStep6,
} from './actions';
import { AccountStep } from './steps/account-step';
import { DegreesStep } from './steps/degrees-step';
import { EmploymentStep } from './steps/employment-step';
import { PrivacyStep } from './steps/privacy-step';
import { ProfileStep } from './steps/profile-step';
import { SkillsStep } from './steps/skills-step';
import { registrationSchema, type RegistrationFormData } from './schema';

/* ─── Step definitions ──────────────────────────────────────────── */

const STEPS = [
    { title: 'Account', description: 'Create your login credentials' },
    { title: 'Degrees', description: 'Add your academic background' },
    { title: 'Profile', description: 'Share a bit about yourself' },
    { title: 'Employment', description: 'Add your career history' },
    { title: 'Skills', description: 'Highlight your expertise' },
    { title: 'Privacy', description: 'Set your preferences' },
];

// Which fields to validate when clicking "Next" on each step
const STEP_FIELDS: Array<Array<keyof RegistrationFormData>> = [
    ['full_name', 'email', 'password'],
    ['selectedLevels'],
    [], // Profile — all optional
    [], // Employment — optional
    [], // Skills — optional
    ['consent_data_storage', 'consent_directory'],
];

/* ─── Resume data type (passed from server) ─────────────────── */

export type ResumeData = {
    userId: string;
    initialStep: number;
    profile: {
        full_name: string;
        email: string;
        phone: string | null;
        city: string | null;
        country: string | null;
        postal_address: string | null;
        bio: string | null;
        privacy_settings: Record<string, string> | null;
    };
    degrees: Array<{ level: 'BS' | 'MS' | 'PhD'; registration_no: string; intake_year: number; graduation_year: number }>;
    employment: Array<{
        job_title: string;
        company: string;
        employment_type: string;
        start_month: string;
        end_month: string;
    }>;
    skills: string[];
};

export function RegisterWizard({ resumeData }: { resumeData?: ResumeData }) {
    const isResuming = !!resumeData;
    const [step, setStep] = useState(isResuming ? resumeData.initialStep : 0);
    const [userId, setUserId] = useState<string | null>(resumeData?.userId ?? null);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Build default values, pre-filling from resume data if available
    const defaultValues = buildDefaults(resumeData);

    const form = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues,
        mode: 'onTouched',
    });

    /* ─── Per-step save logic ─────────────────────────────────── */

    async function saveCurrentStep(): Promise<boolean> {
        setServerError(null);

        // Validate fields for this step
        const fieldsToValidate = STEP_FIELDS[step];
        if (fieldsToValidate && fieldsToValidate.length > 0) {
            const valid = await form.trigger(fieldsToValidate);
            if (!valid) return false;
        }

        setIsSaving(true);
        try {
            const values = form.getValues();
            let result;

            switch (step) {
                case 0: {
                    result = await completeStep1({
                        full_name: values.full_name,
                        email: values.email,
                        password: values.password,
                    });
                    if (result.success && result.userId) {
                        setUserId(result.userId);
                    }
                    break;
                }
                case 1: {
                    if (!userId) { setServerError('Session lost. Please start over.'); return false; }
                    result = await completeStep2({
                        userId,
                        selectedLevels: values.selectedLevels,
                        degreeValues: values.degreeValues,
                    });
                    break;
                }
                case 2: {
                    if (!userId) { setServerError('Session lost. Please start over.'); return false; }
                    result = await completeStep3({
                        userId,
                        phone: values.phone ?? '',
                        city: values.city ?? '',
                        country: values.country ?? '',
                        postal_address: values.postal_address ?? '',
                        bio: values.bio ?? '',
                    });
                    break;
                }
                case 3: {
                    if (!userId) { setServerError('Session lost. Please start over.'); return false; }
                    result = await completeStep4({
                        userId,
                        employment: values.employment ?? [],
                    });
                    break;
                }
                case 4: {
                    if (!userId) { setServerError('Session lost. Please start over.'); return false; }
                    result = await completeStep5({
                        userId,
                        skills: values.skills ?? [],
                    });
                    break;
                }
                case 5: {
                    if (!userId) { setServerError('Session lost. Please start over.'); return false; }
                    result = await completeStep6({
                        userId,
                        privacy_email: values.privacy_email,
                        privacy_phone: values.privacy_phone,
                        privacy_postal_address: values.privacy_postal_address,
                        privacy_city: values.privacy_city,
                        privacy_employment: values.privacy_employment,
                        consent_data_storage: !!values.consent_data_storage,
                        consent_communications: values.consent_communications,
                        consent_directory: !!values.consent_directory,
                    });
                    break;
                }
            }

            if (result && !result.success) {
                setServerError(result.error);
                return false;
            }

            return true;
        } catch {
            setServerError('Something went wrong. Please try again.');
            return false;
        } finally {
            setIsSaving(false);
        }
    }

    async function handleNext() {
        const saved = await saveCurrentStep();
        if (!saved) return;

        if (step === STEPS.length - 1) {
            setSuccess(true);
        } else {
            setStep((s) => s + 1);
        }
    }

    function handleBack() {
        setStep((s) => Math.max(s - 1, isResuming ? resumeData.initialStep : 0));
    }

    if (success) {
        return (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                    <CheckCircle2 className="h-6 w-6 text-brand" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-foreground">
                        {isResuming ? 'Registration complete' : 'Check your email'}
                    </h3>
                    <p className="mt-1 text-sm text-foreground-light">
                        {isResuming
                            ? 'Your profile is now complete. You can close this page or continue to your dashboard.'
                            : 'We\u2019ve sent a verification link to your email address. Click the link to activate your account.'}
                    </p>
                </div>
            </div>
        );
    }

    const isLastStep = step === STEPS.length - 1;
    // Account step (0) is not accessible when resuming (already completed)
    const canGoBack = step > (isResuming ? resumeData.initialStep : 0);

    return (
        <div>
            {/* ─── Step indicator ─────────────────────────────────────── */}
            <div className="mb-6">
                <div className="flex items-center gap-1">
                    {STEPS.map((s, i) => (
                        <div className="flex flex-1 flex-col items-center gap-1.5" key={s.title}>
                            <div
                                className={`h-1 w-full rounded-full transition-colors ${i <= step ? 'bg-brand' : 'bg-surface-300'
                                    }`}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-foreground-lighter">
                        Step {step + 1} of {STEPS.length}
                    </p>
                    <p className="text-xs text-foreground-lighter">{STEPS[step].title}</p>
                </div>
            </div>

            {/* ─── Step title ─────────────────────────────────────────── */}
            <div className="mb-5">
                <h3 className="text-base font-medium text-foreground">{STEPS[step].title}</h3>
                <p className="mt-0.5 text-sm text-foreground-light">{STEPS[step].description}</p>
            </div>

            {/* ─── Step content ───────────────────────────────────────── */}
            <div>
                <div className="min-h-[200px]">
                    {step === 0 && <AccountStep form={form} />}
                    {step === 1 && <DegreesStep form={form} />}
                    {step === 2 && <ProfileStep form={form} />}
                    {step === 3 && <EmploymentStep form={form} />}
                    {step === 4 && <SkillsStep form={form} />}
                    {step === 5 && <PrivacyStep form={form} />}
                </div>

                {serverError && (
                    <p className="mt-3 text-xs text-destructive">{serverError}</p>
                )}

                {/* ─── Navigation ─────────────────────────────────────── */}
                <div className="mt-6 flex items-center justify-between border-t border-border-muted pt-4">
                    {canGoBack ? (
                        <button
                            className="inline-flex items-center gap-1.5 rounded-md border border-secondary bg-button px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-strong hover:bg-surface-300 disabled:opacity-60"
                            disabled={isSaving}
                            onClick={handleBack}
                            type="button"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${isLastStep
                            ? 'rounded-full bg-brand px-5 py-2 text-foreground-contrast hover:bg-brand-600'
                            : 'rounded-full bg-brand px-5 py-2 text-foreground-contrast hover:bg-brand-600'
                            }`}
                        disabled={isSaving}
                        onClick={handleNext}
                        type="button"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : isLastStep ? (
                            'Create account'
                        ) : (
                            <>
                                {step === 3 || step === 4 ? 'Skip' : 'Continue'}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Helper: build form defaults from resume data ──────────── */

function buildDefaults(resumeData?: ResumeData) {
    const base = {
        full_name: '',
        email: '',
        password: '',
        selectedLevels: [] as Array<'BS' | 'MS' | 'PhD'>,
        degreeValues: {} as Record<string, { registration_no: string; intake_year: number; graduation_year: number }>,
        phone: '',
        city: '',
        country: '',
        postal_address: '',
        bio: '',
        employment: [] as Array<{
            job_title: string;
            company: string;
            employment_type: string;
            start_month: string;
            end_month: string;
        }>,
        skills: [] as string[],
        privacy_email: 'private',
        privacy_phone: 'private',
        privacy_postal_address: 'private',
        privacy_city: 'alumni_only',
        privacy_employment: 'public',
        consent_data_storage: undefined as unknown as true,
        consent_communications: false,
        consent_directory: undefined as unknown as true,
    };

    if (!resumeData) return base;

    const p = resumeData.profile;
    const ps = p.privacy_settings;

    return {
        ...base,
        full_name: p.full_name || '',
        email: p.email || '',
        password: 'P@ssword1', // dummy — step 1 already done
        phone: p.phone || '',
        city: p.city || '',
        country: p.country || '',
        postal_address: p.postal_address || '',
        bio: p.bio || '',
        selectedLevels: resumeData.degrees.map((d) => d.level),
        degreeValues: Object.fromEntries(resumeData.degrees.map((d) => [d.level, {
            registration_no: d.registration_no,
            intake_year: d.intake_year,
            graduation_year: d.graduation_year,
        }])),
        employment: resumeData.employment,
        skills: resumeData.skills,
        privacy_email: ps?.email || 'private',
        privacy_phone: ps?.phone || 'private',
        privacy_postal_address: ps?.postal_address || 'private',
        privacy_city: ps?.city || 'alumni_only',
        privacy_employment: ps?.employment || 'public',
    };
}
