import { z } from "zod";

export const PriorityInputSchema = z.object({
  userValue: z.number().int().min(1).max(5),
  businessValue: z.number().int().min(1).max(5),
  urgency: z.number().int().min(1).max(5),
  riskReduction: z.number().int().min(1).max(5),
  dependencyUnlock: z.number().int().min(1).max(5),
  confidence: z.number().int().min(1).max(5),
  effort: z.number().int().min(1),
});

export type PriorityInput = z.infer<typeof PriorityInputSchema>;

export function scorePriority(input: PriorityInput) {
  const parsed = PriorityInputSchema.parse(input);
  const valueScore =
    (parsed.userValue * 25 +
      parsed.businessValue * 20 +
      parsed.urgency * 15 +
      parsed.riskReduction * 15 +
      parsed.dependencyUnlock * 15 +
      parsed.confidence * 10) /
    5;
  const finalScore = Math.round(valueScore / Math.sqrt(Math.max(parsed.effort, 1)));

  const priorityBand: "P0" | "P1" | "P2" | "P3" =
    finalScore >= 75 ? "P0" : finalScore >= 55 ? "P1" : finalScore >= 35 ? "P2" : "P3";

  return {
    ...parsed,
    finalScore,
    priorityBand,
  };
}
