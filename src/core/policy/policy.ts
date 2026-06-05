import type { PolicyDecision } from "./decisions";
import type { GuardMode, GuardPolicy, TransformStrategy } from "../models/policy";
import type { SensitiveSpan } from "../models/span";
import { hasHighRisk } from "./decisions";
import { strategyForSpan } from "../transform/strategies";

export function applyPolicy(input: { spans: SensitiveSpan[]; mode: GuardMode; policy: GuardPolicy }): PolicyDecision {
  const enabled = new Set(input.policy.enabledClasses);
  const spans = input.mode === "custom" ? input.spans.filter((span) => enabled.has(span.class)) : input.spans;
  const strategyOverrides = new Map<string, TransformStrategy>();
  const warnings: string[] = [];

  for (const span of spans) {
    const override = input.mode === "custom" ? input.policy.customStrategies[span.class] : undefined;
    let strategy = strategyForSpan(span, override);

    if (input.mode === "strict" && (span.class === "private_key" || span.severity === "critical")) {
      strategy = "block";
    }

    strategyOverrides.set(span.id, strategy);
  }

  if (spans.length === 0) {
    return { decision: "allow", strategyOverrides, warnings };
  }

  if ([...strategyOverrides.values()].includes("block")) {
    warnings.push("High-risk content must not be submitted in raw form.");
    return { decision: "block", strategyOverrides, warnings };
  }

  if (input.mode === "assist") {
    return { decision: hasHighRisk(spans) ? "ask" : "transform", strategyOverrides, warnings };
  }

  return { decision: "transform", strategyOverrides, warnings };
}
