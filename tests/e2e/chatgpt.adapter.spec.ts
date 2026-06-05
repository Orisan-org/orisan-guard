import { chatgptAdapter } from "../../src/adapters/chatgpt/adapter";
import { expect, test } from "@playwright/test";

test("ChatGPT adapter is scoped to ChatGPT hosts", () => {
  expect(chatgptAdapter.matches(new URL("https://chatgpt.com/") as unknown as Location)).toBe(true);
  expect(chatgptAdapter.matches(new URL("https://example.com/") as unknown as Location)).toBe(false);
});
