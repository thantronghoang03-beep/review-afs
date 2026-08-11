import { differenceInCalendarDays } from "date-fns";
import type { PeriodType } from "@/types/check";

interface PeriodTypeInput {
  periodPriorStart: string | null;
  periodPriorEnd: string | null;
  isDissolution: boolean;
}

// Deterministic, code-side decision — the AI never infers this from raw dates.
export function computePeriodType(input: PeriodTypeInput): PeriodType {
  if (input.isDissolution) return "dissolution";

  if (!input.periodPriorStart || !input.periodPriorEnd) {
    return "first";
  }

  const days = differenceInCalendarDays(
    new Date(input.periodPriorEnd),
    new Date(input.periodPriorStart)
  );

  // A full accounting year is ~365/366 days; allow slack for month-length variance.
  return days < 364 ? "short_prior" : "normal";
}
