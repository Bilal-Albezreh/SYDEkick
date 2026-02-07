// lib/validations/squads.ts
import { z } from "zod";

// =====================================================
// SQUAD CREATION
// =====================================================
export const createSquadSchema = z.object({
    name: z.string()
        .min(3, "Squad name must be at least 3 characters")
        .max(50, "Squad name must be less than 50 characters")
        .trim(),
    description: z.string()
        .max(500, "Description must be less than 500 characters")
        .optional()
        .nullable(),
    program: z.string()
        .max(100, "Program must be less than 100 characters")
        .optional()
        .nullable(),
    term: z.string()
        .max(50, "Term must be less than 50 characters")
        .optional()
        .nullable(),
    is_official: z.boolean().default(false),
});

export type CreateSquadInput = z.infer<typeof createSquadSchema>;

// =====================================================
// JOIN SQUAD
// =====================================================
export const joinSquadSchema = z.object({
    invite_code: z.string()
        .length(8, "Invite code must be exactly 8 characters")
        .regex(/^[a-z0-9]+$/, "Invalid invite code format")
        .trim()
        .toLowerCase(),
});

export type JoinSquadInput = z.infer<typeof joinSquadSchema>;

// =====================================================
// TASK TEMPLATE CREATION (for squad leaders)
// =====================================================
export const createTaskSchema = z.object({
    squad_id: z.string().uuid("Invalid squad ID"),
    title: z.string()
        .min(1, "Title is required")
        .max(200, "Title must be less than 200 characters")
        .trim(),
    description: z.string()
        .max(1000, "Description must be less than 1000 characters")
        .optional()
        .nullable(),
    due_date: z.string().datetime("Invalid date format"),
    weight: z.number()
        .min(0, "Weight must be at least 0")
        .max(100, "Weight cannot exceed 100")
        .optional()
        .nullable(),
    type: z.enum(['assignment', 'exam', 'quiz', 'project', 'other']),
    category: z.enum(['academic', 'social']).default('academic'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// =====================================================
// SQUAD EVENT CREATION (Social events)
// =====================================================
export const createSquadEventSchema = z.object({
    squad_id: z.string().uuid("Invalid squad ID"),
    title: z.string()
        .min(1, "Title is required")
        .max(200, "Title must be less than 200 characters")
        .trim(),
    description: z.string()
        .max(1000, "Description must be less than 1000 characters")
        .optional()
        .nullable(),
    due_date: z.string().datetime("Invalid date format"),
    category: z.literal('social'),
});

export type CreateSquadEventInput = z.infer<typeof createSquadEventSchema>;

// =====================================================
// USER TASK STATE UPDATE (Smart Overlay)
// =====================================================
export const updateTaskStateSchema = z.object({
    template_id: z.string().uuid("Invalid template ID"),

    // User overrides (nullable = use template default)
    custom_title: z.string()
        .max(200, "Custom title must be less than 200 characters")
        .trim()
        .optional()
        .nullable(),
    custom_date: z.string()
        .datetime("Invalid date format")
        .optional()
        .nullable(),
    custom_weight: z.number()
        .min(0, "Weight must be at least 0")
        .max(100, "Weight cannot exceed 100")
        .optional()
        .nullable(),

    // Private user data
    status: z.enum(['pending', 'completed', 'late']).optional(),
    grade: z.number()
        .min(0, "Grade must be at least 0")
        .max(100, "Grade cannot exceed 100")
        .optional()
        .nullable(),
    notes: z.string()
        .max(2000, "Notes must be less than 2000 characters")
        .optional()
        .nullable(),
});

export type UpdateTaskStateInput = z.infer<typeof updateTaskStateSchema>;
