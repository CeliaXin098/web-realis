import { z } from "zod";

export const healingPrescriptionSchema = z.object({
  film: z.array(z.string()).default([]),
  book: z.array(z.string()).default([]),
  music: z.array(z.string()).default([]),
  action: z.array(z.string()).default([]),
});

export const reasoningNotesSchema = z
  .object({
    emotional_root_basis: z.string().default(""),
    pattern_basis: z.string().default(""),
    future_self_note_basis: z.string().default(""),
    prescription_reasons: z
      .object({
        film: z.array(z.string()).default([]),
        book: z.array(z.string()).default([]),
        music: z.array(z.string()).default([]),
        action: z.array(z.string()).default([]),
      })
      .default({}),
  })
  .default({});

export const jungianFunctionSchema = z.object({
  code: z.enum(["Ni", "Ne", "Si", "Se", "Ti", "Te", "Fi", "Fe"]),
  tendency: z.string(),
  evidence: z.string(),
  score: z.number().int().min(1).max(5).default(3),
});

export const compassUpdateSchema = z.object({
  relationship_type: z.string(),
  nickname: z.string(),
  closeness_score: z.number().int().min(1).max(5).default(3),
  health_score: z.number().int().min(1).max(5).nullable().optional(),
  joy_score: z.number().int().min(1).max(5).nullable().optional(),
  tier: z.number().int().min(1).max(4).nullable().optional(),
  relation_mode_tags: z.array(z.string()).default([]),
  common_triggers: z.array(z.string()).default([]),
  relationship_pattern_summary: z.string(),
  mbti_tendency: z.string(),
  jungian_functions: z.array(jungianFunctionSchema).default([]),
  interaction_guide: z.string(),
});

export const reflectionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  gentle_response: z.string(),
  emotional_root: z.string(),
  underlying_needs: z.array(z.string()).default([]),
  pattern: z.string(),
  prescriptions: healingPrescriptionSchema,
  future_self_note: z.string(),
  reasoning_notes: reasoningNotesSchema,
  compass_updates: z.array(compassUpdateSchema).default([]),
  safety_note: z.string().nullable().default(null),
});

export type JungianFunctionInsight = z.infer<typeof jungianFunctionSchema>;
export type ReflectionOutput = z.infer<typeof reflectionSchema>;
