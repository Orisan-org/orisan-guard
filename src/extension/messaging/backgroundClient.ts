import type { AnalyzeTextMessage, AnalyzeTextResponse, ErrorResponse, GuardMessage, SettingsResponse } from "./contracts";

export async function analyzeText(message: AnalyzeTextMessage): Promise<AnalyzeTextResponse> {
  const response = (await chrome.runtime.sendMessage(message)) as AnalyzeTextResponse | ErrorResponse;
  if (!response.ok) throw new Error(response.error);
  return response;
}

export async function loadSettingsFromBackground(): Promise<SettingsResponse> {
  const response = (await chrome.runtime.sendMessage({ action: "LOAD_SETTINGS" } satisfies GuardMessage)) as
    | SettingsResponse
    | ErrorResponse;
  if (!response.ok) throw new Error(response.error);
  return response;
}
