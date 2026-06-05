export function safePreview(value: string, visiblePrefix = 4): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= visiblePrefix) {
    return "[REDACTED]";
  }
  return `${trimmed.slice(0, visiblePrefix)}...[REDACTED]`;
}

export function maskValue(label: string): string {
  return `[REDACTED_${label.toUpperCase()}]`;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
