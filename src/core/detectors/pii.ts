import type { Detector, DetectorInput } from "./base";
import { collectMatches, makeSpan } from "./helpers";
import { knownCardPrefix, luhnValid, ssnStructureValid } from "./validators";

const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phone =
  /(?:\+?1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const delimitedSsn = /\b(\d{3})([- ])(\d{2})\2(\d{4})\b/g;
const bareSsn = /\b\d{9}\b/g;
const paymentCard = /\b(?:\d[ -]?){11,18}\d\b/g;
const contextualId =
  /\b(?:customer|account|tenant|user)[_-]?(?:id|number)?\s*[:=#-]?\s*([A-Z]{2,}-\d{3,}|[A-Za-z0-9_-]{8,})\b/gi;

export const piiDetector: Detector = {
  id: "detector.pii",
  label: "PII and identifiers",
  async detect(input: DetectorInput) {
    const ssnOffsets = new Set<string>();
    const ssnSpans = [
      ...(await collectMatches(input.text, delimitedSsn, (match) => {
        const area = match[1] ?? "";
        const group = match[3] ?? "";
        const serial = match[4] ?? "";
        if (!ssnStructureValid(area, group, serial))
          return Promise.resolve(null);

        ssnOffsets.add(`${match.index}:${match.index + match[0].length}`);
        return makeSpan({
          class: "ssn",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.9,
          detectorId: "GUARD-PII-004",
          reason: "US Social Security Number pattern detected.",
          suggestedStrategy: "placeholder",
        });
      })),
      ...(await collectMatches(input.text, bareSsn, (match) => {
        const key = `${match.index}:${match.index + match[0].length}`;
        if (ssnOffsets.has(key)) return Promise.resolve(null);

        const before = input.text
          .slice(Math.max(0, match.index - 40), match.index)
          .toLowerCase();
        if (!before.includes("ssn") && !before.includes("social security")) {
          return Promise.resolve(null);
        }

        const value = match[0];
        if (
          !ssnStructureValid(
            value.slice(0, 3),
            value.slice(3, 5),
            value.slice(5, 9),
          )
        ) {
          return Promise.resolve(null);
        }

        return makeSpan({
          class: "ssn",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value,
          confidence: 0.8,
          detectorId: "GUARD-PII-004",
          reason: "US Social Security Number pattern detected.",
          suggestedStrategy: "placeholder",
        });
      })),
    ];

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
          suggestedStrategy: "placeholder",
        }),
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
          suggestedStrategy: "placeholder",
        }),
      )),
      ...ssnSpans,
      ...(await collectMatches(input.text, paymentCard, (match) => {
        const digits = match[0].replace(/[ -]/g, "");
        if (!luhnValid(digits) || !knownCardPrefix(digits)) {
          return Promise.resolve(null);
        }

        return makeSpan({
          class: "payment_card",
          severity: "critical",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.95,
          detectorId: "GUARD-PII-005",
          reason: "Payment card number detected (Luhn-validated).",
          suggestedStrategy: "placeholder",
        });
      })),
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
          suggestedStrategy: "placeholder",
        }),
      )),
    ];
  },
};
