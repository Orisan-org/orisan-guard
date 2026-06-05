import type { Detector, DetectorInput } from "./base";
import { collectMatches, makeSpan } from "./helpers";

const privateIp =
  /\b(?:(?:10)\.(?:\d{1,3}\.){2}\d{1,3}|(?:172)\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|(?:192)\.168\.\d{1,3}\.\d{1,3}|127\.0\.0\.1)\b/g;
const internalUrl = /\bhttps?:\/\/[A-Za-z0-9.-]*(?:\.internal|\.local|\.corp|\.svc\.cluster\.local|localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3})[^\s'"<>]*/gi;
const internalHostname = /\b[A-Za-z0-9-]+(?:[-.](?:prod|staging|dev|admin|internal|svc|cluster|corp|local|payments|auth)){1,}[A-Za-z0-9.-]*\b/gi;
const stackPath = /\s(?:\/(?:Users|home|var|srv|opt)\/[^\s)]+|[A-Za-z]:\\[^\s)]+)/g;

export const internalDetector: Detector = {
  id: "detector.internal",
  label: "Internal infrastructure",
  async detect(input: DetectorInput) {
    return [
      ...(await collectMatches(input.text, internalUrl, (match) =>
        makeSpan({
          class: "internal_url",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.88,
          detectorId: "GUARD-INTERNAL-001",
          reason: "Internal URL detected.",
          suggestedStrategy: "generalize"
        })
      )),
      ...(await collectMatches(input.text, privateIp, (match) =>
        makeSpan({
          class: "private_ip",
          severity: "medium",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.9,
          detectorId: "GUARD-INTERNAL-002",
          reason: "Private IP address detected.",
          suggestedStrategy: "placeholder"
        })
      )),
      ...(await collectMatches(input.text, internalHostname, (match) =>
        makeSpan({
          class: "internal_hostname",
          severity: "medium",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.72,
          detectorId: "GUARD-INTERNAL-001",
          reason: "Internal hostname-like value detected.",
          suggestedStrategy: "generalize"
        })
      )),
      ...(await collectMatches(input.text, stackPath, (match) =>
        makeSpan({
          class: "stack_trace",
          severity: "medium",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.68,
          detectorId: "GUARD-INTERNAL-003",
          reason: "Local/internal path in stack trace detected.",
          suggestedStrategy: "placeholder"
        })
      ))
    ];
  }
};
