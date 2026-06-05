import { chromium, expect, type BrowserContext, test } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const extensionPath = path.resolve(".output/chrome-mv3");
const syntheticSecret = "ghp_FAKE1234567890abcdef1234567890abcd";
type ExtensionWorker = ReturnType<BrowserContext["serviceWorkers"]>[number];

const privateKey = `-----BEGIN PRIVATE KEY-----
FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE
-----END PRIVATE KEY-----`;

test("final pre-send verification rewrites a secret reintroduced after preview", async () => {
  const server = await startFixtureServer();
  const context = await launchContext();

  try {
    const page = await context.newPage();
    await page.goto(server.url("/local-ai-fixture.html"));
    await page.locator("#editor").fill(`Token is ${syntheticSecret}`);
    await expect(page.locator("#orisan-guard-root")).toContainText("Protected");
    await page.getByRole("button", { name: /Apply safe version/i }).click();
    await expect(page.locator("#editor")).not.toContainText(syntheticSecret);

    await page.locator("#editor").fill(`Token is ${syntheticSecret}`);
    await page.locator("#send").click();

    await expect(page.locator("#sent-log")).toContainText("REDACTED");
    await expect(page.locator("#sent-log")).not.toContainText(syntheticSecret);
  } finally {
    await context.close();
    await server.close();
  }
});

test("strict mode blocks private key submission and leaves sent log empty", async () => {
  const server = await startFixtureServer();
  const context = await launchContext();

  try {
    const worker = await getServiceWorker(context);
    await setModeThroughOptions(context, worker, "strict");

    const page = await context.newPage();
    await page.goto(server.url("/local-ai-fixture.html"));
    await page.locator("#editor").fill(privateKey);
    await expect(page.locator("#orisan-guard-root")).toContainText("Blocked");
    await page.locator("#send").click();
    await expect(page.locator("#sent-log")).toHaveText("");
    await expect(page.locator("#orisan-guard-root")).toContainText("Blocked high-risk content");
  } finally {
    await context.close();
    await server.close();
  }
});

test("matched local pages without a supported editor show unsupported instead of false protection", async () => {
  const server = await startFixtureServer();
  const context = await launchContext();

  try {
    const page = await context.newPage();
    await page.goto(server.url("/unsupported.html"));
    await expect(page.locator("#orisan-guard-root")).toContainText("unsupported or changed page structure");
  } finally {
    await context.close();
    await server.close();
  }
});

test("local evidence stores metadata only, not raw or rewritten prompt text", async () => {
  const server = await startFixtureServer();
  const context = await launchContext();

  try {
    const worker = await getServiceWorker(context);
    const page = await context.newPage();
    await page.goto(server.url("/local-ai-fixture.html"));
    await page.locator("#editor").fill(`Token is ${syntheticSecret}`);
    await expect(page.locator("#orisan-guard-root")).toContainText("Protected");
    await page.getByRole("button", { name: /Apply safe version/i }).click();
    await page.locator("#send").click();
    await expect(page.locator("#sent-log")).toContainText("REDACTED");

    const stored = await worker.evaluate(async () => chrome.storage.local.get("guard:evidence:v1"));
    const serialized = JSON.stringify(stored);
    expect(serialized).toContain("payloadStored");
    expect(serialized).toContain("originalTextStored");
    expect(serialized).toContain("rewrittenTextStored");
    expect(serialized).not.toContain(syntheticSecret);
    expect(serialized).not.toContain("REDACTED_TOKEN");
  } finally {
    await context.close();
    await server.close();
  }
});

async function launchContext(): Promise<BrowserContext> {
  return chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
}

async function getServiceWorker(context: BrowserContext): Promise<ExtensionWorker> {
  const existing = context.serviceWorkers()[0];
  return existing ?? context.waitForEvent("serviceworker");
}

async function setModeThroughOptions(context: BrowserContext, worker: ExtensionWorker, mode: string): Promise<void> {
  const extensionId = new URL(worker.url()).host;
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.getByLabel("Mode").selectOption(mode);
  await expect(options.getByRole("status")).toContainText("Saved");
  await options.close();
}

async function startFixtureServer(): Promise<{ url: (pathname: string) => string; close: () => Promise<void> }> {
  const fixture = await readFile(path.resolve("tests/pages/local-ai-fixture.html"));
  const unsupported = Buffer.from("<!doctype html><html><body><main>No supported prompt editor here.</main></body></html>");
  const server = createServer((request, response) => {
    const body = request.url?.includes("unsupported") ? unsupported : fixture;
    response.writeHead(200, { "content-type": "text/html" });
    response.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to start fixture server");
  return {
    url: (pathname: string) => `http://127.0.0.1:${address.port}${pathname}`,
    close: () => closeServer(server)
  };
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
