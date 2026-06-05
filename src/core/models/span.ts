import type { SensitivityClass, Severity, TransformStrategy } from "./policy";

export interface SensitiveSpan {
  id: string;
  class: SensitivityClass;
  severity: Severity;
  start: number;
  end: number;
  originalHash: string;
  preview: string;
  confidence: number;
  detectorId: string;
  reason: string;
  suggestedStrategy: TransformStrategy;
}
