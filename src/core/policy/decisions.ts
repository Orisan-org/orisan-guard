import type { GuardDecision } from "../models/analysis";
import type { TransformStrategy } from "../models/policy";
import type { SensitiveSpan } from "../models/span";
import { severityRank } from "../utils/text";

export interface PolicyDecision {
  decision: GuardDecision;
  strategyOverrides: Map<string, TransformStrategy>;
  warnings: string[];
}

export function hasHighRisk(spans: SensitiveSpan[]): boolean {
  return spans.some((span) => severityRank(span.severity) >= severityRank("high"));
}
