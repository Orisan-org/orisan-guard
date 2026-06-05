import type { SensitivityClass, Severity, TransformStrategy } from "./policy";

export interface GuardFinding {
  id: string;
  title: string;
  severity: Severity;
  category: SensitivityClass;
  target: string;
  evidence: string;
  transformation: TransformStrategy;
  remediation: string;
  payloadStored: false;
}
