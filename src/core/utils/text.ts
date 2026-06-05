import type { SensitiveSpan } from "../models/span";

export function overlaps(a: SensitiveSpan, b: SensitiveSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

export function sortSpans(spans: SensitiveSpan[]): SensitiveSpan[] {
  return [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
}

export function severityRank(severity: SensitiveSpan["severity"]): number {
  return { info: 0, low: 1, medium: 2, high: 3, critical: 4 }[severity];
}

export function dedupeOverlaps(spans: SensitiveSpan[]): SensitiveSpan[] {
  const sorted = sortSpans(spans).sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return severityRank(b.severity) - severityRank(a.severity);
  });
  const result: SensitiveSpan[] = [];

  for (const candidate of sorted) {
    const existingIndex = result.findIndex((existing) => overlaps(existing, candidate));
    if (existingIndex === -1) {
      result.push(candidate);
      continue;
    }

    const existing = result[existingIndex];
    if (!existing) continue;
    const candidateScore = severityRank(candidate.severity) * 100 + (candidate.end - candidate.start);
    const existingScore = severityRank(existing.severity) * 100 + (existing.end - existing.start);
    if (candidateScore > existingScore) {
      result[existingIndex] = candidate;
    }
  }

  return sortSpans(result);
}
