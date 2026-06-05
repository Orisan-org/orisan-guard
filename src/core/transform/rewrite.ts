import type { TransformStrategy } from "../models/policy";
import type { SensitiveSpan } from "../models/span";
import { sortSpans } from "../utils/text";
import { maskForSpan } from "./mask";
import { PlaceholderMap } from "./placeholders";

export interface RewriteResult {
  text: string;
  strategiesUsed: Map<string, TransformStrategy>;
  blocked: boolean;
}

export function rewriteText(input: {
  text: string;
  spans: SensitiveSpan[];
  strategyOverrides?: Map<string, TransformStrategy>;
}): RewriteResult {
  const placeholders = new PlaceholderMap();
  const strategiesUsed = new Map<string, TransformStrategy>();
  let cursor = 0;
  let output = "";
  let blocked = false;

  for (const span of sortSpans(input.spans)) {
    if (span.start < cursor) continue;

    const original = input.text.slice(span.start, span.end);
    const strategy = input.strategyOverrides?.get(span.id) ?? span.suggestedStrategy;
    strategiesUsed.set(span.id, strategy);
    output += input.text.slice(cursor, span.start);
    output += transformValue(strategy, span, original, placeholders);
    if (strategy === "block") blocked = true;
    cursor = span.end;
  }

  output += input.text.slice(cursor);
  return { text: output, strategiesUsed, blocked };
}

function transformValue(
  strategy: TransformStrategy,
  span: SensitiveSpan,
  original: string,
  placeholders: PlaceholderMap
): string {
  switch (strategy) {
    case "keep":
      return original;
    case "mask":
      return maskForSpan(span, original);
    case "placeholder":
      return placeholders.get(span.originalHash, span.class);
    case "generalize":
      return generalize(span);
    case "block":
      return `[BLOCKED_${span.class.toUpperCase()}]`;
    case "ask":
      return placeholders.get(span.originalHash, span.class);
    case "summarize":
      return placeholders.get(span.originalHash, span.class);
  }
}

function generalize(span: SensitiveSpan): string {
  switch (span.class) {
    case "internal_url":
      return "an internal URL";
    case "internal_hostname":
      return "an internal service";
    case "business_sensitive":
      return "private business context";
    default:
      return `[PRIVATE_${span.class.toUpperCase()}]`;
  }
}
