import { contentEditableInput } from "../base/InputController";
import { buttonSendController } from "../base/SendController";
import type { SiteAdapter } from "../base/SiteAdapter";

export const localFixtureAdapter: SiteAdapter = {
  id: "local_fixture",
  label: "Local fixture",
  matches(location) {
    return location.hostname === "127.0.0.1" || location.hostname === "localhost";
  },
  findInput() {
    const editor = document.querySelector<HTMLElement>("#editor[contenteditable='true']");
    return editor ? contentEditableInput(editor) : null;
  },
  findSendControl() {
    const button = document.querySelector<HTMLElement>("#send");
    return button ? buttonSendController(button) : null;
  },
  mountPoint(input) {
    return input.element;
  }
};
