import type { Detector, DetectorInput } from "./base";
import { collectMatches, makeSpan } from "./helpers";

const githubToken = /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g;
const slackToken = /\bxox[baprs]-[A-Za-z0-9-]{12,}\b/g;
const awsAccessKey = /\bAKIA[0-9A-Z]{16}\b/g;
const bearerToken = /\bBearer\s+([A-Za-z0-9._~+/=-]{20,})\b/g;
const jwtLike = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const privateKey = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const databaseUrl = /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/@]+:[^@\s]+@[^\s'"<>]+/gi;
const webhookUrl = /\bhttps:\/\/hooks\.(?:slack|discord)\.com\/[A-Za-z0-9_./-]+/gi;
const assignmentSecret =
  /\b(?:api[_-]?key|secret|token|password|client[_-]?secret)\b\s*[:=]\s*["']?([A-Za-z0-9_./+=-]{16,})["']?/gi;

export const secretDetector: Detector = {
  id: "detector.secret",
  label: "Secrets and credentials",
  async detect(input: DetectorInput) {
    const spans = [
      ...(await collectMatches(input.text, githubToken, (match) =>
        makeSpan({
          class: "secret",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.95,
          detectorId: "GUARD-SECRET-001",
          reason: "GitHub token-like value detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, slackToken, (match) =>
        makeSpan({
          class: "secret",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.94,
          detectorId: "GUARD-SECRET-001",
          reason: "Slack token-like value detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, awsAccessKey, (match) =>
        makeSpan({
          class: "secret",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.9,
          detectorId: "GUARD-SECRET-001",
          reason: "AWS access key ID-like value detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, bearerToken, (match) =>
        makeSpan({
          class: "secret",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.88,
          detectorId: "GUARD-SECRET-001",
          reason: "Bearer token detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, jwtLike, (match) =>
        makeSpan({
          class: "secret",
          severity: "medium",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.75,
          detectorId: "GUARD-SECRET-001",
          reason: "JWT-like token detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, assignmentSecret, (match) =>
        makeSpan({
          class: "source_config",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.82,
          detectorId: "GUARD-SECRET-001",
          reason: "Secret-like config assignment detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, privateKey, (match) =>
        makeSpan({
          class: "private_key",
          severity: "critical",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.99,
          detectorId: "GUARD-SECRET-002",
          reason: "Private key material detected.",
          suggestedStrategy: "block"
        })
      )),
      ...(await collectMatches(input.text, databaseUrl, (match) =>
        makeSpan({
          class: "database_url",
          severity: "critical",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.96,
          detectorId: "GUARD-SECRET-003",
          reason: "Database URL with embedded credentials detected.",
          suggestedStrategy: "mask"
        })
      )),
      ...(await collectMatches(input.text, webhookUrl, (match) =>
        makeSpan({
          class: "webhook_url",
          severity: "high",
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          confidence: 0.9,
          detectorId: "GUARD-SECRET-004",
          reason: "Webhook URL detected.",
          suggestedStrategy: "mask"
        })
      ))
    ];

    return spans;
  }
};
