import { z } from "zod";
import type { AnalysisResult, GuardDestination, GuardMode, GuardPolicy } from "../../core";

const customTermSchema = z.object({
  id: z.string(),
  value: z.string(),
  label: z.string().optional(),
  strategy: z.enum(["placeholder", "generalize", "block"]),
  sensitivityClass: z.enum(["custom_term", "service_name", "project_codename", "business_sensitive"]).optional()
});

export const guardPolicySchema: z.ZodType<GuardPolicy> = z.object({
  enabledClasses: z.array(
    z.enum([
      "secret",
      "private_key",
      "database_url",
      "webhook_url",
      "email",
      "phone",
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
      "custom_term"
    ])
  ),
  customTerms: z.array(customTermSchema),
  customStrategies: z.record(
    z.enum([
      "secret",
      "private_key",
      "database_url",
      "webhook_url",
      "email",
      "phone",
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
      "custom_term"
    ]),
    z.enum(["keep", "mask", "placeholder", "generalize", "summarize", "ask", "block"])
  ),
  evidenceEnabled: z.boolean()
});

export const analyzeTextMessageSchema = z.object({
  action: z.literal("ANALYZE_TEXT"),
  text: z.string().max(200_000),
  destination: z.enum(["chatgpt", "claude", "gemini", "perplexity", "local_fixture", "unknown"])
});

export const saveSettingsMessageSchema = z.object({
  action: z.literal("SAVE_SETTINGS"),
  mode: z.enum(["assist", "auto_protect", "strict", "custom"]),
  policy: guardPolicySchema
});

export const loadSettingsMessageSchema = z.object({
  action: z.literal("LOAD_SETTINGS")
});

export const clearEvidenceMessageSchema = z.object({
  action: z.literal("CLEAR_EVIDENCE")
});

export const loadEvidenceMessageSchema = z.object({
  action: z.literal("LOAD_EVIDENCE")
});

export const messageSchema = z.discriminatedUnion("action", [
  analyzeTextMessageSchema,
  saveSettingsMessageSchema,
  loadSettingsMessageSchema,
  clearEvidenceMessageSchema,
  loadEvidenceMessageSchema
]);

export type GuardMessage = z.infer<typeof messageSchema>;

export interface AnalyzeTextMessage {
  action: "ANALYZE_TEXT";
  text: string;
  destination: GuardDestination;
}

export interface AnalyzeTextResponse {
  ok: true;
  result: AnalysisResult;
}

export interface SettingsResponse {
  ok: true;
  mode: GuardMode;
  policy: GuardPolicy;
}

export interface ErrorResponse {
  ok: false;
  error: string;
}
