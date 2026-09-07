/**
 * Request validation schemas (zod).
 *
 * 2026-08-30: routes previously did `req.body as any` straight into
 * services/DB — no boundary validation at all. Every mutating route now
 * parses through a schema here: bad input gets a clean 400 with a
 * field-level message instead of a 500 from deep inside Postgres.
 *
 * Philosophy: STRICT on identity fields (ids, phones), LENIENT elsewhere
 * (`.passthrough()` keeps unknown fields flowing — services own their
 * domain rules; this layer only guarantees shape/sanity).
 */
import { z } from 'zod';

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Parse a request body against a schema → typed data or a 400-ready message. */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): ParseResult<T> {
  const result = schema.safeParse(body ?? {});
  if (result.success) return { ok: true, data: result.data };
  const issues = result.error.issues
    .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
    .join('; ');
  return { ok: false, error: issues };
}

// ── Auth ─────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().trim().min(3).max(320),
  password: z.string().min(1).max(200),
});

// ── Leads ────────────────────────────────────────────────────────
const uuidField = z.string().uuid('must be a uuid');

export const leadCreateSchema = z
  .object({
    full_name: z.string().trim().min(1, 'full_name is required').max(200),
    phone: z.string().trim().min(7).max(20).optional(),
    email: z.string().trim().email().max(320).optional().or(z.literal('')),
    status: z.string().max(50).optional(),
    temperature: z.enum(['hot', 'warm', 'cold']).optional(),
    source: z.string().max(100).optional(),
    notes: z.string().max(5000).optional(),
  })
  .passthrough();

export const leadUpdateSchema = z
  .object({
    full_name: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    email: z.string().trim().email().max(320).optional().or(z.literal('')),
    status: z.string().max(50).optional(),
    temperature: z.enum(['hot', 'warm', 'cold']).optional(),
  })
  .passthrough();

export const leadIdParamSchema = z.object({ id: uuidField });

export const followupCreateSchema = z
  .object({
    note: z.string().max(2000).optional(),
    due_date: z.string().max(40).optional(),
    due_at: z.string().max(40).optional(),
  })
  .passthrough()
  .refine((b) => Object.keys(b).length > 0, { message: 'empty followup body' });

// ── Calls ────────────────────────────────────────────────────────
export const startCallSchema = z.object({
  leadId: uuidField,
});

export const dncAddSchema = z.object({
  phone: z.string().trim().min(7, 'phone too short').max(20),
  reason: z.string().max(500).optional(),
});

// ── Agent config ─────────────────────────────────────────────────
export const agentConfigSaveSchema = z
  .object({
    business_name: z.string().max(200).optional(),
  })
  .passthrough();

export const applyTemplateSchema = z.object({
  templateId: z.string().trim().min(1).max(100),
  businessName: z.string().trim().min(1).max(200).optional(),
});