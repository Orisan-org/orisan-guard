import type { GuardDecision } from "../models/analysis";
import type { GuardMode } from "../models/policy";
import type { SensitiveSpan } from "../models/span";

export interface GuardEvidence {
  eventId: string;
  timestamp: string;
  destination: string;
  mode: GuardMode;
  detectedClasses: Record<string, number>;
  strategiesUsed: Record<string, number>;
  decision: GuardDecision;
  payloadStored: false;
  originalTextStored: false;
  rewrittenTextStored: false;
  latencyMs: number;
}

export function createEvidence(input: {
  destination: string;
  mode: GuardMode;
  spans: SensitiveSpan[];
  decision: GuardDecision;
  latencyMs: number;
}): GuardEvidence {
  const detectedClasses: Record<string, number> = {};
  const strategiesUsed: Record<string, number> = {};

  for (const span of input.spans) {
    detectedClasses[span.class] = (detectedClasses[span.class] ?? 0) + 1;
    strategiesUsed[span.suggestedStrategy] = (strategiesUsed[span.suggestedStrategy] ?? 0) + 1;
  }

  return {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    destination: input.destination,
    mode: input.mode,
    detectedClasses,
    strategiesUsed,
    decision: input.decision,
    payloadStored: false,
    originalTextStored: false,
    rewrittenTextStored: false,
    latencyMs: input.latencyMs
  };
}
