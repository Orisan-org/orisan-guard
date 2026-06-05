import type { Detector, DetectorInput } from "./base";
import { collectMatches, makeSpan } from "./helpers";

const envLine = /^(?:export\s+)?[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|DSN|DATABASE_URL)[A-Z0-9_]*\s*=\s*.+$/gim;
const structuredSecret = /["']?(?:apiKey|secret|token|password|clientSecret|databaseUrl)["']?\s*:\s*["'][^"']{8,}["']/g;

export const configDetector: Detector = {
  id: "detector.config",
  label: "Source and config secrets",
  async detect(input: DetectorInput) {
    return [
      ...(await collectMatches(input.text, envLine, (match) =>
        makeSpan({
          class: "source_config",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.84,
          detectorId: "GUARD-SECRET-001",
          reason: ".env-style sensitive config line detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, structuredSecret, (match) =>
        makeSpan({
          class: "source_config",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.8,
          detectorId: "GUARD-SECRET-001",
          reason: "Structured config secret detected.",
          suggestedStrategy: "mask"
        })
      ))
    ];
  }
};
