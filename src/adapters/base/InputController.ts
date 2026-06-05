export interface InputController {
  element: HTMLElement;
  read(): string;
  write(value: string): Promise<void>;
}

export function contentEditableInput(element: HTMLElement): InputController {
  return {
    element,
    read: () => element.innerText || element.textContent || "",
    async write(value: string) {
      element.textContent = value;
      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    }
  };
}

export function textAreaInput(element: HTMLTextAreaElement): InputController {
  return {
    element,
    read: () => element.value,
    async write(value: string) {
      element.value = value;
      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    }
  };
}
