import type { SensitivityClass, Severity, TransformStrategy } from "../models/policy";
import type { SensitiveSpan } from "../models/span";
import { safePreview } from "../utils/redact";
import { sha256Hex } from "../utils/hashing";

export async function makeSpan(input: {
  class: SensitivityClass;
  severity: Severity;
  start: number;
  end: number;
  value: string;
  confidence: number;
  detectorId: string;
  reason: string;
  suggestedStrategy: TransformStrategy;
}): Promise<SensitiveSpan> {
  return {
    id: `${input.detectorId}:${input.start}:${input.end}`,
    class: input.class,
    severity: input.severity,
    start: input.start,
    end: input.end,
    originalHash: await sha256Hex(input.value),
    preview: safePreview(input.value),
    confidence: input.confidence,
    detectorId: input.detectorId,
    reason: input.reason,
    suggestedStrategy: input.suggestedStrategy
  };
}

export async function collectMatches(
  text: string,
  regex: RegExp,
  spanFactory: (match: RegExpExecArray) => Promise<SensitiveSpan | null>
): Promise<SensitiveSpan[]> {
  const spans: SensitiveSpan[] = [];
  for (const match of text.matchAll(regex)) {
    const span = await spanFactory(match);
    if (span) spans.push(span);
  }
  return spans;
}
