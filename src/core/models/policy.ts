export type SensitivityClass =
  | "secret"
  | "private_key"
  | "database_url"
  | "webhook_url"
  | "email"
  | "phone"
  | "ssn"
  | "payment_card"
  | "customer_identifier"
  | "internal_url"
  | "internal_hostname"
  | "private_ip"
  | "service_name"
  | "project_codename"
  | "ticket_id"
  | "stack_trace"
  | "source_config"
  | "business_sensitive"
  | "custom_term";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type TransformStrategy =
  | "keep"
  | "mask"
  | "placeholder"
  | "generalize"
  | "summarize"
  | "ask"
  | "block";

export type GuardMode = "assist" | "auto_protect" | "strict" | "custom";

export interface CustomTerm {
  id: string;
  value: string;
  label?: string | undefined;
  strategy: Extract<TransformStrategy, "placeholder" | "generalize" | "block">;
  sensitivityClass?:
    | Extract<
        SensitivityClass,
        | "custom_term"
        | "service_name"
        | "project_codename"
        | "business_sensitive"
      >
    | undefined;
}

export interface GuardPolicy {
  enabledClasses: SensitivityClass[];
  customTerms: CustomTerm[];
  customStrategies: Partial<Record<SensitivityClass, TransformStrategy>>;
  evidenceEnabled: boolean;
}

export const allSensitivityClasses: SensitivityClass[] = [
  "secret",
  "private_key",
  "database_url",
  "webhook_url",
  "email",
  "phone",
  "ssn",
  "payment_card",
  "customer_identifier",
  "internal_url",
  "internal_hostname",
  "private_ip",
  "service_name",
  "project_codename",
  "ticket_id",
  "stack_trace",
  "source_config",
  "business_sensitive",
  "custom_term",
];

export const defaultPolicy: GuardPolicy = {
  enabledClasses: allSensitivityClasses,
  customTerms: [],
  customStrategies: {},
  evidenceEnabled: true,
};
