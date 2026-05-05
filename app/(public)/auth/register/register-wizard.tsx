'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Clock, Loader2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
    completeStep1,
    completeStep2,
    completeStep3,
    completeStep4,
    completeStep5,
    completeStep6,
    resendVerificationOtp,
    skipStep,
    verifyEmailOtp,
} from './actions';
import { AccountStep } from './steps/account-step';
import { AchievementsStep } from './steps/achievements-step';
import { DegreesStep } from './steps/degrees-step';
import { EmploymentStep } from './steps/employment-step';
import { PrivacyStep } from './steps/privacy-step';
import { ProfileStep } from './steps/profile-step';
import { registrationSchema, type RegistrationFormData } from './schema';

/* ─── Step definitions ──────────────────────────────────────────── */

const STEPS = [
    { title: 'Create Account', description: 'Set up your login credentials' },
    { title: 'Academic Background', description: 'Add your degree information' },
    { title: 'Profile Details', description: 'Tell us a bit about yourself' },
    { title: 'Employment History', description: 'Share your career background' },
    { title: 'Achievements', description: 'Highlight your accomplishments' },
    { title: 'Privacy Settings', description: 'Control who sees your information' },
];

const STEP_FIELDS: Array<Array<keyof RegistrationFormData>> = [
    ['full_name', 'email', 'password'],
    ['selectedLevels'],
    [],
    [],
    [],
    ['consent_data_storage', 'consent_directory'],
];

/* ─── Resume data type ───────────────────────────────────────── */

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
    degrees: Array<{ level: 'BS' | 'MS' | 'PhD'; registration_no: string; intake_year: number | null }>;
    employment: Array<{
        job_title: string;
        company: string;
        employment_type: string;
        start_month: string;
        end_month: string;
    }>;
    achievements: Array<{ title: string; year?: number; description?: string }>;
    skills: string[];
};

const OTP_SESSION_KEY = 'reg_pending_otp';

export function RegisterWizard({ resumeData }: { resumeData?: ResumeData }) {
    const isResuming = !!resumeData;
    const [step, setStep] = useState(isResuming ? resumeData.initialStep : 0);
    const [userId, setUserId] = useState<string | null>(resumeData?.userId ?? null);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // OTP state
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpResent, setOtpResent] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isResendingOtp, setIsResendingOtp] = useState(false);
    const otpInputRef = useRef<HTMLInputElement>(null);

    // Restore OTP state from sessionStorage on mount (handles page reload during OTP step)
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(OTP_SESSION_KEY);
            if (stored && step === 0) {
                const { email } = JSON.parse(stored);
                if (email) {
                    setOtpEmail(email);
                    setShowOtp(true);
                }
            }
        } catch {
            // ignore
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (showOtp) {
            setTimeout(() => otpInputRef.current?.focus(), 100);
        }
    }, [showOtp]);

    const defaultValues = buildDefaults(resumeData);

    const form = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues,
        mode: 'onTouched',
    });

    /* ─── Per-step save logic ─────────────────────────────────── */

    async function saveCurrentStep(): Promise<boolean> {
        setServerError(null);

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
                        setOtpEmail(values.email);
                        // Persist email for page-reload recovery
                        try {
                            sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify({ email: values.email }));
                        } catch { /* ignore */ }
                        setShowOtp(true);
                        return false; // don't advance step yet
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
                        achievements: values.achievements ?? [],
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

    async function handleSkip() {
        if (!userId || step === STEPS.length - 1) return;
        setIsSaving(true);
        setServerError(null);
        try {
            await skipStep({ userId, toStep: step + 1 });
            setStep((s) => s + 1);
        } catch {
            setServerError('Something went wrong.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleVerifyOtp() {
        if (!otpValue.trim() || otpValue.trim().length !== 8) {
            setOtpError('Please enter the 8-digit code from your email.');
            return;
        }
        setOtpError(null);
        setIsVerifyingOtp(true);
        try {
            const result = await verifyEmailOtp({
                email: otpEmail,
                otp: otpValue.trim(),
            });
            if (!result.success) {
                setOtpError(result.error ?? 'Verification failed.');
            } else {
                if (result.userId) setUserId(result.userId);
                try { sessionStorage.removeItem(OTP_SESSION_KEY); } catch { /* ignore */ }
                setShowOtp(false);
                setOtpValue('');
                setStep(1);
            }
        } catch {
            setOtpError('Something went wrong. Please try again.');
        } finally {
            setIsVerifyingOtp(false);
        }
    }

    async function handleResendOtp() {
        setIsResendingOtp(true);
        setOtpError(null);
        try {
            await resendVerificationOtp({ email: otpEmail });
            setOtpResent(true);
            setTimeout(() => setOtpResent(false), 4000);
        } catch {
            setOtpError('Failed to resend. Please try again.');
        } finally {
            setIsResendingOtp(false);
        }
    }

    /* ─── Success screen ──────────────────────────────────────── */

    if (success) {
        return (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                    <CheckCircle2 className="h-7 w-7 text-brand" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Profile submitted!</h3>
                    <p className="mt-1.5 text-sm text-foreground-light max-w-sm">
                        Your profile is complete and has been submitted for admin review.
                    </p>
                </div>
                <div className="w-full rounded-lg border border-border-muted bg-surface-100 p-4 text-left">
                    <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-foreground-lighter" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Pending approval</p>
                            <p className="mt-0.5 text-xs text-foreground-light">
                                You&apos;ll receive an email once your account is approved. After approval you can access the full alumni directory and events.
                            </p>
                        </div>
                    </div>
                </div>
                <Link
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600"
                    href="/dashboard"
                >
                    Go to dashboard
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        );
    }

    /* ─── OTP verification screen ─────────────────────────────── */

    if (showOtp) {
        return (
            <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                        <Mail className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Check your email</h3>
                        <p className="mt-0.5 text-sm text-foreground-light">
                            We sent an 8-digit verification code to <span className="font-medium text-foreground">{otpEmail}</span>
                        </p>
                    </div>
                </div>

                <div>
                    <span className="mb-1.5 block text-sm font-medium text-foreground-light">Verification code</span>
                    <input
                        autoComplete="one-time-code"
                        className="text-center text-xl tracking-[0.4em] font-mono"
                        inputMode="numeric"
                        maxLength={8}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                            setOtpValue(val);
                            setOtpError(null);
                        }}
                        placeholder="00000000"
                        ref={otpInputRef}
                        type="text"
                        value={otpValue}
                    />
                    {otpError && <p className="mt-1.5 text-xs text-destructive">{otpError}</p>}
                </div>

                <button
                    className="w-full rounded-full bg-brand py-2.5 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600 disabled:opacity-60"
                    disabled={isVerifyingOtp || otpValue.length !== 8}
                    onClick={handleVerifyOtp}
                    type="button"
                >
                    {isVerifyingOtp ? (
                        <span className="inline-flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                        </span>
                    ) : (
                        'Verify email'
                    )}
                </button>

                <div className="flex items-center justify-between border-t border-border-muted pt-3">
                    <p className="text-xs text-foreground-lighter">Didn&apos;t receive the code?</p>
                    <button
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand transition-colors hover:text-brand-600 disabled:opacity-50"
                        disabled={isResendingOtp}
                        onClick={handleResendOtp}
                        type="button"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isResendingOtp ? 'animate-spin' : ''}`} />
                        {otpResent ? 'Code sent!' : 'Resend code'}
                    </button>
                </div>
            </div>
        );
    }

    /* ─── Step indicator (only for profile steps 1-5) ────────── */
    const profileSteps = STEPS.slice(1);
    const profileStepIndex = step - 1; // 0-indexed within profile steps

    const isProfileStep = step >= 1;
    const isLastStep = step === STEPS.length - 1;
    const isOptionalStep = step >= 1; // All profile steps (1-5) are skippable

    return (
        <div>
            {/* Progress indicator — shown only for profile steps */}
            {isProfileStep && (
                <div className="mb-6">
                    <div className="flex items-center gap-1">
                        {profileSteps.map((s, i) => (
                            <div className="flex flex-1 flex-col items-center gap-1.5" key={s.title}>
                                <div
                                    className={`h-1 w-full rounded-full transition-colors ${i <= profileStepIndex ? 'bg-brand' : 'bg-surface-300'}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-foreground-lighter">
                            Step {step} of {STEPS.length - 1}
                        </p>
                        <p className="text-xs text-foreground-lighter">{STEPS[step].title}</p>
                    </div>
                </div>
            )}

            {/* Step title — hidden on step 0 since AuthShell already shows the page title */}
            {step > 0 && (
                <div className="mb-5">
                    <h3 className="text-base font-semibold text-foreground">{STEPS[step].title}</h3>
                    <p className="mt-0.5 text-sm text-foreground-light">{STEPS[step].description}</p>
                </div>
            )}

            {/* Step content */}
            <div>
                <div className="min-h-[200px]">
                    {step === 0 && <AccountStep form={form} />}
                    {step === 1 && <DegreesStep form={form} />}
                    {step === 2 && <ProfileStep form={form} />}
                    {step === 3 && <EmploymentStep form={form} />}
                    {step === 4 && <AchievementsStep form={form} />}
                    {step === 5 && <PrivacyStep form={form} />}
                </div>

                {serverError && (
                    <p className="mt-3 text-xs text-destructive">{serverError}</p>
                )}

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between border-t border-border-muted pt-4">
                    {/* Left side: Skip (for optional profile steps that aren't the last) */}
                    {isOptionalStep && !isLastStep ? (
                        <button
                            className="text-sm text-foreground-lighter transition-colors hover:text-foreground disabled:opacity-50"
                            disabled={isSaving}
                            onClick={handleSkip}
                            type="button"
                        >
                            Skip for now
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-medium text-foreground-contrast transition-colors hover:bg-brand-600 disabled:opacity-60"
                        disabled={isSaving}
                        onClick={handleNext}
                        type="button"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : step === 0 ? (
                            'Create Account'
                        ) : isLastStep ? (
                            'Complete Profile'
                        ) : (
                            <>
                                Save & Continue
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Helper: build form defaults ───────────────────────────── */

function buildDefaults(resumeData?: ResumeData) {
    const base = {
        full_name: '',
        email: '',
        password: '',
        selectedLevels: [] as Array<'BS' | 'MS' | 'PhD'>,
        degreeValues: {} as Record<string, { registration_no: string; batch_no?: number }>,
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
        achievements: [] as Array<{ title: string; year?: number; description?: string }>,
        skills: [] as string[],
        privacy_email: 'alumni_only',
        privacy_phone: 'alumni_only',
        privacy_postal_address: 'alumni_only',
        privacy_city: 'alumni_only',
        privacy_employment: 'alumni_only',
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
            batch_no: d.intake_year ? d.intake_year - 1998 : undefined,
        }])),
        employment: resumeData.employment,
        achievements: resumeData.achievements,
        skills: resumeData.skills,
        privacy_email: ps?.email || 'alumni_only',
        privacy_phone: ps?.phone || 'alumni_only',
        privacy_postal_address: ps?.postal_address || 'alumni_only',
        privacy_city: ps?.city || 'alumni_only',
        privacy_employment: ps?.employment || 'alumni_only',
    };
}
