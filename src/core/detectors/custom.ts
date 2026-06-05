import type { Detector, DetectorInput } from "./base";
import { makeSpan } from "./helpers";
import { escapeRegExp } from "../utils/redact";

export const customTermDetector: Detector = {
  id: "detector.custom_term",
  label: "Custom protected terms",
  async detect(input: DetectorInput) {
    const spans = [];
    for (const term of input.customTerms) {
      const value = term.value.trim();
      if (value.length < 2) continue;
      const regex = new RegExp(`\\b${escapeRegExp(value)}\\b`, "gi");
      for (const match of input.text.matchAll(regex)) {
        spans.push(
          await makeSpan({
            class: term.sensitivityClass ?? "custom_term",
            severity: term.strategy === "block" ? "high" : "medium",
            start: match.index,
            end: match.index + match[0].length,
            value: match[0],
            confidence: 0.98,
            detectorId: "GUARD-CUSTOM-001",
            reason: `Custom protected term${term.label ? ` (${term.label})` : ""} detected.`,
            suggestedStrategy: term.strategy
          })
        );
      }
    }
    return spans;
  }
};
