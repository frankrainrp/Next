import { z } from "zod";

export const IntentCaptureSchema = z.object({
  action: z.string().min(1),
  purpose: z.string().min(1),
  primaryGoal: z.string().min(1),
  goalType: z.enum(["ranking", "delivery", "learning", "exam", "application", "research", "other"]),
  ambiguity: z.array(z.string()),
});

export const DailyTaskSchema = z.object({
  date: z.string(),
  primaryTask: z.string(),
  supportTasks: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  estimatedHours: z.number().positive(),
  fallbackTask: z.string().optional(),
  linkedGoalIds: z.array(z.string()),
  riskNote: z.string().optional(),
});

export const OutcomeEstimateSchema = z.object({
  probabilityMin: z.number().min(0).max(100),
  probabilityMax: z.number().min(0).max(100),
  confidence: z.enum(["low", "medium", "high"]),
  factors: z.array(
    z.object({
      label: z.string(),
      impact: z.enum(["positive", "negative"]),
      weight: z.number(),
      explanation: z.string(),
    }),
  ),
  suggestedNextMove: z.string(),
});

export type IntentCapture = z.infer<typeof IntentCaptureSchema>;
export type DailyTask = z.infer<typeof DailyTaskSchema>;
export type OutcomeEstimate = z.infer<typeof OutcomeEstimateSchema>;
