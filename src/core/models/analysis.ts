import type { GuardEvidence } from "../evidence/evidence";
import type { GuardMode, GuardPolicy, SensitivityClass } from "./policy";
import type { SensitiveSpan } from "./span";

export type GuardDestination = "chatgpt" | "claude" | "gemini" | "perplexity" | "local_fixture" | "unknown";
export type GuardDecision = "allow" | "transform" | "ask" | "block";

export interface AnalysisInput {
  text: string;
  surface: "browser";
  destination: GuardDestination;
  mode: GuardMode;
  policy: GuardPolicy;
}

export interface AnalysisResult {
  safe: boolean;
  decision: GuardDecision;
  spans: SensitiveSpan[];
  protectedCounts: Record<SensitivityClass, number>;
  rewrittenText: string;
  warnings: string[];
  evidence: GuardEvidence;
}
