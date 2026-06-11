import type { SensitiveSpan } from "../models/span";
import { maskValue } from "../utils/redact";

export function maskForSpan(span: SensitiveSpan, original: string): string {
  switch (span.class) {
    case "database_url":
      return maskDatabaseUrl(original);
    case "webhook_url":
      return maskValue("WEBHOOK_URL");
    case "private_key":
      return maskValue("PRIVATE_KEY");
    case "source_config":
      return maskConfigLine(original);
    default:
      return maskValue(span.class === "secret" ? "TOKEN" : span.class);
  }
}

function maskDatabaseUrl(value: string): string {
  const kind =
    value.match(/^(postgresql?|mysql|mongodb(?:\+srv)?|redis):\/\//i)?.[1] ??
    "DATABASE";
  return `[REDACTED_${kind.toUpperCase().replace("+", "_")}_DATABASE_URL]`;
}

function maskConfigLine(value: string): string {
  const separator = value.includes("=") ? "=" : ":";
  const [key] = value.split(separator);
  if (!key) return maskValue("CONFIG_SECRET");
  return `${key.trim()}${separator}${maskValue("CONFIG_SECRET")}`;
}
