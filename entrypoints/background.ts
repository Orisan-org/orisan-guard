import { defineBackground } from "wxt/sandbox";
import { analyze } from "../src/core";
import { messageSchema } from "../src/extension/messaging/contracts";
import { appendEvidence, clearEvidence, loadEvidence } from "../src/extension/storage/evidenceStore";
import { loadSettings, saveSettings } from "../src/extension/storage/settings";

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((rawMessage, sender, sendResponse) => {
    void handleMessage(rawMessage, sender)
      .then(sendResponse)
      .catch(() => sendResponse({ ok: false, error: "Guard request failed." }));
    return true;
  });
});

async function handleMessage(rawMessage: unknown, sender: chrome.runtime.MessageSender) {
  const parsed = messageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    return { ok: false, error: "Invalid Guard message." };
  }

  if (sender.id !== chrome.runtime.id) {
    return { ok: false, error: "Invalid sender." };
  }

  switch (parsed.data.action) {
    case "ANALYZE_TEXT": {
      const settings = await loadSettings();
      const result = await analyze({
        text: parsed.data.text,
        surface: "browser",
        destination: parsed.data.destination,
        mode: settings.mode,
        policy: settings.policy
      });
      if (settings.policy.evidenceEnabled) {
        await appendEvidence(result.evidence);
      }
      return { ok: true, result };
    }
    case "LOAD_SETTINGS": {
      const settings = await loadSettings();
      return { ok: true, ...settings };
    }
    case "SAVE_SETTINGS":
      await saveSettings({ mode: parsed.data.mode, policy: parsed.data.policy });
      return { ok: true };
    case "LOAD_EVIDENCE":
      return { ok: true, evidence: await loadEvidence() };
    case "CLEAR_EVIDENCE":
      await clearEvidence();
      return { ok: true };
  }
}
