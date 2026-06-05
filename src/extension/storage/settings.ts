import { z } from "zod";
import { allSensitivityClasses, defaultPolicy, type GuardMode, type GuardPolicy } from "../../core";

const customTermSchema = z.object({
  id: z.string(),
  value: z.string(),
  label: z.string().optional(),
  strategy: z.enum(["placeholder", "generalize", "block"]),
  sensitivityClass: z.enum(["custom_term", "service_name", "project_codename", "business_sensitive"]).optional()
});

const settingsSchema = z.object({
  mode: z.enum(["assist", "auto_protect", "strict", "custom"]),
  policy: z.object({
    enabledClasses: z.array(z.enum(allSensitivityClasses as [typeof allSensitivityClasses[number], ...typeof allSensitivityClasses])),
    customTerms: z.array(customTermSchema),
    customStrategies: z.record(z.string(), z.enum(["keep", "mask", "placeholder", "generalize", "summarize", "ask", "block"])),
    evidenceEnabled: z.boolean()
  })
});

export interface GuardSettings {
  mode: GuardMode;
  policy: GuardPolicy;
}

export const defaultSettings: GuardSettings = {
  mode: "assist",
  policy: defaultPolicy
};

const key = "guard:settings:v1";

export async function loadSettings(): Promise<GuardSettings> {
  const stored = await chrome.storage.local.get(key);
  const parsed = settingsSchema.safeParse(stored[key]);
  return parsed.success ? parsed.data : defaultSettings;
}

export async function saveSettings(settings: GuardSettings): Promise<void> {
  const parsed = settingsSchema.parse(settings);
  await chrome.storage.local.set({ [key]: parsed });
}
