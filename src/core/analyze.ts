import { defaultDetectors } from "./detectors";
import { createEvidence } from "./evidence/evidence";
import type { AnalysisInput, AnalysisResult } from "./models/analysis";
import type { SensitivityClass } from "./models/policy";
import { applyPolicy } from "./policy/policy";
import { rewriteText } from "./transform/rewrite";
import { dedupeOverlaps } from "./utils/text";

export async function analyze(input: AnalysisInput): Promise<AnalysisResult> {
  const started = performance.now();
  const detected = [];

  for (const detector of defaultDetectors) {
    detected.push(
      ...(await detector.detect({
        text: input.text,
        destination: input.destination,
        customTerms: input.policy.customTerms
      }))
    );
  }

  const enabled = new Set(input.policy.enabledClasses);
  const spans = dedupeOverlaps(detected).filter((span) => input.mode !== "custom" || enabled.has(span.class));
  const policyDecision = applyPolicy({ spans, mode: input.mode, policy: input.policy });
  const rewrite = rewriteText({ text: input.text, spans, strategyOverrides: policyDecision.strategyOverrides });
  const latencyMs = Math.max(0, Math.round(performance.now() - started));
  const evidence = createEvidence({
    destination: input.destination,
    mode: input.mode,
    spans,
    decision: policyDecision.decision,
    latencyMs
  });

  return {
    safe: policyDecision.decision === "allow",
    decision: policyDecision.decision,
    spans,
    protectedCounts: countByClass(spans),
    rewrittenText: policyDecision.decision === "allow" ? input.text : rewrite.text,
    warnings: policyDecision.warnings,
    evidence
  };
}

function countByClass(spans: Array<{ class: SensitivityClass }>): Record<SensitivityClass, number> {
  const counts: Partial<Record<SensitivityClass, number>> = {};
  for (const span of spans) {
    counts[span.class] = (counts[span.class] ?? 0) + 1;
  }
  return counts as Record<SensitivityClass, number>;
}
