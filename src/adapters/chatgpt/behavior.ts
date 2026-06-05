import { startGuardAdapter } from "../base/domGuards";
import { chatgptAdapter } from "./adapter";

export function startChatgptGuard(): void {
  const start = () => {
    if (chatgptAdapter.matches(location)) {
      startGuardAdapter(chatgptAdapter);
    }
  };
  start();
  const observer = new MutationObserver(() => {
    if (!document.getElementById("orisan-guard-root")) start();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
