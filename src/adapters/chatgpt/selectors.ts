export const chatgptSelectors = {
  editors: [
    "#prompt-textarea",
    "textarea[data-id='root']",
    "textarea",
    "div[contenteditable='true'][role='textbox']",
    "div[contenteditable='true']"
  ],
  sendButtons: [
    "button[data-testid='send-button']",
    "button[aria-label*='Send']",
    "button[aria-label*='send']",
    "form button[type='submit']"
  ]
};
