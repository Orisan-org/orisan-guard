import { contentEditableInput, textAreaInput } from "../base/InputController";
import { buttonSendController } from "../base/SendController";
import type { SiteAdapter } from "../base/SiteAdapter";
import { chatgptSelectors } from "./selectors";

export const chatgptAdapter: SiteAdapter = {
  id: "chatgpt",
  label: "ChatGPT experimental",
  matches(location) {
    return location.hostname === "chatgpt.com" || location.hostname === "chat.openai.com";
  },
  findInput() {
    for (const selector of chatgptSelectors.editors) {
      const candidate = document.querySelector<HTMLElement>(selector);
      if (candidate instanceof HTMLTextAreaElement) return textAreaInput(candidate);
      if (candidate?.isContentEditable) return contentEditableInput(candidate);
    }
    return null;
  },
  findSendControl() {
    for (const selector of chatgptSelectors.sendButtons) {
      const button = document.querySelector<HTMLElement>(selector);
      if (button) return buttonSendController(button);
    }
    return null;
  },
  mountPoint(input) {
    return input.element;
  }
};
