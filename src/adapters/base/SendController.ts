export type BeforeSendCallback = (event: Event) => Promise<boolean>;
export type Unsubscribe = () => void;

export interface SendController {
  element: HTMLElement;
  onBeforeSend(callback: BeforeSendCallback): Unsubscribe;
  submit(): void;
}

export function buttonSendController(element: HTMLElement): SendController {
  let allowNextClick = false;
  return {
    element,
    onBeforeSend(callback) {
      const listener = (event: Event) => {
        if (allowNextClick) {
          allowNextClick = false;
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        void callback(event).then((allowed) => {
          if (allowed) {
            allowNextClick = true;
            window.setTimeout(() => element.click(), 0);
          }
        });
      };
      element.addEventListener("click", listener, true);
      return () => element.removeEventListener("click", listener, true);
    },
    submit() {
      element.click();
    }
  };
}
