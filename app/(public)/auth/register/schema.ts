import { z } from 'zod';

export const registrationSchema = z.object({
    // Step 1 — Account
    full_name: z.string().trim().min(1, 'Full name is required').max(100),
    email: z.string().email('Please enter a valid email'),
    password: z
        .string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'At least one uppercase letter')
        .regex(/[0-9]/, 'At least one number')
        .regex(/[^A-Za-z0-9]/, 'At least one special character'),

    // Step 2 — Degrees
    selectedLevels: z.array(z.enum(['BS', 'MS', 'PhD'])).min(1, 'Select at least one degree'),
    degreeValues: z.object({
        BS: z
            .object({
                registration_no: z.string(),
                batch_no: z.number().optional(),
            })
            .optional(),
        MS: z
            .object({
                registration_no: z.string(),
                batch_no: z.number().optional(),
            })
            .optional(),
        PhD: z
            .object({
                registration_no: z.string(),
                batch_no: z.number().optional(),
            })
            .optional(),
    }),

    // Step 3 — Profile
    phone: z.string().max(20).optional().default(''),
    city: z.string().max(100).optional().default(''),
    country: z.string().max(2).optional().default(''),
    postal_address: z.string().max(200).optional().default(''),
    bio: z.string().max(300).optional().default(''),

    // Step 4 — Employment
    employment: z
        .array(
            z.object({
                job_title: z.string(),
                company: z.string(),
                employment_type: z.string(),
                start_month: z.string(),
                end_month: z.string(),
            }),
        )
        .optional()
        .default([]),

    // Step 5 — Achievements & Skills
    achievements: z
        .array(
            z.object({
                title: z.string(),
                year: z.number().optional(),
                description: z.string().optional(),
            }),
        )
        .optional()
        .default([]),
    skills: z.array(z.string()).max(20).optional().default([]),

    // Step 6 — Privacy & Consent
    privacy_email: z.string().default('alumni_only'),
    privacy_phone: z.string().default('alumni_only'),
    privacy_postal_address: z.string().default('alumni_only'),
    privacy_city: z.string().default('alumni_only'),
    privacy_employment: z.string().default('alumni_only'),
    consent_data_storage: z.literal(true, {
        error: 'You must accept the data storage policy',
    }),
    consent_communications: z.boolean().default(false),
    consent_directory: z.literal(true, {
        error: 'Directory consent is required',
    }),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
