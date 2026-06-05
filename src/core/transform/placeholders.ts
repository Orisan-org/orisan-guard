import type { SensitivityClass } from "../models/policy";

const labels: Partial<Record<SensitivityClass, string>> = {
  email: "EMAIL",
  phone: "PHONE",
  customer_identifier: "CUSTOMER_ID",
  internal_url: "INTERNAL_URL",
  internal_hostname: "INTERNAL_HOST",
  private_ip: "PRIVATE_IP",
  service_name: "INTERNAL_SERVICE",
  project_codename: "PROJECT",
  ticket_id: "TICKET",
  stack_trace: "INTERNAL_PATH",
  custom_term: "CUSTOM_TERM",
  business_sensitive: "PRIVATE_CONTEXT"
};

export class PlaceholderMap {
  private readonly counts = new Map<string, number>();
  private readonly values = new Map<string, string>();

  get(key: string, sensitivityClass: SensitivityClass): string {
    const existing = this.values.get(key);
    if (existing) return existing;

    const label = labels[sensitivityClass] ?? sensitivityClass.toUpperCase();
    const next = (this.counts.get(label) ?? 0) + 1;
    this.counts.set(label, next);
    const placeholder = `${label}_${next}`;
    this.values.set(key, placeholder);
    return placeholder;
  }
}
