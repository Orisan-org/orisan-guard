import { chromium, expect, test } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const extensionPath = path.resolve(".output/chrome-mv3");

test("local fixture protects synthetic secret before send", async () => {
  const server = await startFixtureServer();
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const page = await context.newPage();
    await page.goto(server.url);
    const secret = "ghp_FAKE1234567890abcdef1234567890abcd";
    await page.locator("#editor").fill(`Token is ${secret}`);
    await expect(page.locator("#orisan-guard-root")).toContainText("Protected");
    await page.getByRole("button", { name: /Apply safe version/i }).click();
    await page.locator("#send").click();
    await expect(page.locator("#sent-log")).not.toContainText(secret);
    await expect(page.locator("#sent-log")).toContainText("REDACTED");
  } finally {
    await context.close();
    await server.close();
  }
});

async function startFixtureServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const file = await readFile(path.resolve("tests/pages/local-ai-fixture.html"));
  const server = createServer((_, response) => {
    response.writeHead(200, { "content-type": "text/html" });
    response.end(file);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to start fixture server");
  return {
    url: `http://127.0.0.1:${address.port}/local-ai-fixture.html`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}
