import type { GuardEvidence } from "../../core";

const key = "guard:evidence:v1";
const maxEvents = 100;

export async function appendEvidence(evidence: GuardEvidence): Promise<void> {
  const stored = await chrome.storage.local.get(key);
  const existing = Array.isArray(stored[key]) ? (stored[key] as GuardEvidence[]) : [];
  const next = [evidence, ...existing].slice(0, maxEvents);
  await chrome.storage.local.set({ [key]: next });
}

export async function loadEvidence(): Promise<GuardEvidence[]> {
  const stored = await chrome.storage.local.get(key);
  return Array.isArray(stored[key]) ? (stored[key] as GuardEvidence[]) : [];
}

export async function clearEvidence(): Promise<void> {
  await chrome.storage.local.set({ [key]: [] });
}
