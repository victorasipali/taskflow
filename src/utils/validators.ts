import { z } from 'zod';

export const MAX_TITLE_LENGTH = 120;
export const MAX_NOTES_LENGTH = 2000;
export const MAX_PROJECT_NAME_LENGTH = 60;

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
    email,
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({ email });

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(MAX_PROJECT_NAME_LENGTH, `Keep it under ${MAX_PROJECT_NAME_LENGTH} characters`),
  description: z.string().trim().max(300, 'Keep the description under 300 characters'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Pick a colour'),
});

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(MAX_TITLE_LENGTH, `Keep the title under ${MAX_TITLE_LENGTH} characters`),
  notes: z.string().trim().max(MAX_NOTES_LENGTH, `Notes must be under ${MAX_NOTES_LENGTH} characters`),
  projectId: z.string().min(1, 'Choose a project'),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  dueAt: z.date().nullable(),
  remind: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ProjectFormValues = z.infer<typeof projectSchema>;
export type TaskFormValues = z.infer<typeof taskSchema>;

/** Field-name → first error message, ready to render inline under each input. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function validate<T>(
  schema: z.ZodType<T>,
  values: unknown,
): { ok: true; data: T } | { ok: false; errors: FieldErrors<T> } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };

  const errors: FieldErrors<T> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof T | undefined;
    if (field !== undefined && errors[field] === undefined) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
