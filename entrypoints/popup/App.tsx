import { useEffect, useState } from "react";
import type { GuardMode } from "../../src/core";
import { loadSettingsFromBackground } from "../../src/extension/messaging/backgroundClient";
import { GuardBadge } from "../../src/ui/components/GuardBadge";

export function App() {
  const [mode, setMode] = useState<GuardMode>("assist");
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    void loadSettingsFromBackground()
      .then((settings) => {
        setMode(settings.mode);
        setStatus("ready");
      })
      .catch(() => setStatus("unavailable"));
  }, []);

  return (
    <main>
      <h1>Orisan Guard</h1>
      <GuardBadge status={status} />
      <p>Current mode: {mode.replace("_", " ")}</p>
      <p>Supported sites show the Guard indicator near the prompt box.</p>
      <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>
        Open options
      </button>
    </main>
  );
}
