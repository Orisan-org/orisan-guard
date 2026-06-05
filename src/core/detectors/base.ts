import type { CustomTerm } from "../models/policy";
import type { SensitiveSpan } from "../models/span";

export interface DetectorInput {
  text: string;
  destination: string;
  customTerms: CustomTerm[];
}

export interface Detector {
  id: string;
  label: string;
  detect(input: DetectorInput): Promise<SensitiveSpan[]>;
}
