import { defineContentScript } from "wxt/sandbox";
import "../src/ui/styles/guard.css";
import { startChatgptGuard } from "../src/adapters/chatgpt/behavior";

export default defineContentScript({
  matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  main() {
    startChatgptGuard();
  }
});
