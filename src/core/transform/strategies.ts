import type { SensitivityClass, TransformStrategy } from "../models/policy";
import type { SensitiveSpan } from "../models/span";

export function strategyForSpan(span: SensitiveSpan, override?: TransformStrategy): TransformStrategy {
  if (override) return override;
  if (span.suggestedStrategy !== "summarize" && span.suggestedStrategy !== "ask") return span.suggestedStrategy;

  const mapping: Partial<Record<SensitivityClass, TransformStrategy>> = {
    secret: "mask",
    private_key: "block",
    database_url: "mask",
    webhook_url: "mask",
    email: "placeholder",
    phone: "placeholder",
    customer_identifier: "placeholder",
    internal_url: "generalize",
    internal_hostname: "generalize",
    private_ip: "placeholder",
    service_name: "placeholder",
    project_codename: "placeholder",
    ticket_id: "placeholder",
    stack_trace: "placeholder",
    source_config: "mask",
    business_sensitive: "ask",
    custom_term: "placeholder"
  };

  return mapping[span.class] ?? "placeholder";
}
