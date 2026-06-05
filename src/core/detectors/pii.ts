import type { Detector, DetectorInput } from "./base";
import { collectMatches, makeSpan } from "./helpers";

const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phone = /(?:\+?1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const contextualId = /\b(?:customer|account|tenant|user)[_-]?(?:id|number)?\s*[:=#-]?\s*([A-Z]{2,}-\d{3,}|[A-Za-z0-9_-]{8,})\b/gi;

export const piiDetector: Detector = {
  id: "detector.pii",
  label: "PII and identifiers",
  async detect(input: DetectorInput) {
    return [
      ...(await collectMatches(input.text, email, (match) =>
        makeSpan({
          class: "email",
          severity: "medium",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.9,
          detectorId: "GUARD-PII-001",
          reason: "Email address detected.",
          suggestedStrategy: "placeholder"
        })
      )),
      ...(await collectMatches(input.text, phone, (match) =>
        makeSpan({
          class: "phone",
          severity: "medium",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.78,
          detectorId: "GUARD-PII-002",
          reason: "Phone number-like value detected.",
          suggestedStrategy: "placeholder"
        })
      )),
      ...(await collectMatches(input.text, contextualId, (match) =>
        makeSpan({
          class: "customer_identifier",
          severity: "medium",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.74,
          detectorId: "GUARD-PII-003",
          reason: "Customer/account identifier with context detected.",
          suggestedStrategy: "placeholder"
        })
      ))
    ];
  }
};
