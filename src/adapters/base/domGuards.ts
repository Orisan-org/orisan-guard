import type { AnalysisResult } from "../../core";
import { analyzeText } from "../../extension/messaging/backgroundClient";
import type { SiteAdapter } from "./SiteAdapter";

interface GuardRuntimeState {
  lastResult: AnalysisResult | null;
  safeText: string | null;
  blocked: boolean;
}

export function startGuardAdapter(adapter: SiteAdapter): void {
  const input = adapter.findInput();
  const send = adapter.findSendControl();
  if (!input || !send) {
    renderUnsupported(adapter);
    return;
  }

  const state: GuardRuntimeState = { lastResult: null, safeText: null, blocked: false };
  const root = createRoot(adapter.mountPoint(input));
  const analyzeCurrent = debounce(async () => {
    const text = input.read();
    if (!text.trim()) {
      renderStatus(root, adapter.label, "Ready", state, input);
      return;
    }
    const response = await analyzeText({ action: "ANALYZE_TEXT", text, destination: adapter.id });
    state.lastResult = response.result;
    state.safeText = response.result.rewrittenText;
    state.blocked = response.result.decision === "block";
    renderStatus(root, adapter.label, summary(response.result), state, input);
  }, 250);

  input.element.addEventListener("input", analyzeCurrent);
  input.element.addEventListener("paste", analyzeCurrent);
  renderStatus(root, adapter.label, "Ready", state, input);

  send.onBeforeSend(async () => {
    const current = input.read();
    const verification = (await analyzeText({ action: "ANALYZE_TEXT", text: current, destination: adapter.id })).result;
    state.lastResult = verification;
    state.safeText = verification.rewrittenText;
    state.blocked = verification.decision === "block";

    if (verification.decision === "allow") {
      renderStatus(root, adapter.label, "Safe to send", state, input);
      return true;
    }

    if (verification.decision === "block") {
      renderStatus(root, adapter.label, "Blocked high-risk content", state, input);
      return false;
    }

    await input.write(verification.rewrittenText);
    const second = (await analyzeText({ action: "ANALYZE_TEXT", text: input.read(), destination: adapter.id })).result;
    if (second.decision === "allow" || second.spans.every((span) => span.severity !== "high" && span.severity !== "critical")) {
      renderStatus(root, adapter.label, "Applied safe rewrite", state, input);
      return true;
    }
    renderStatus(root, adapter.label, "Blocked after verification", state, input);
    return false;
  });
}

function createRoot(anchor: HTMLElement): HTMLElement {
  let root = document.getElementById("orisan-guard-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "orisan-guard-root";
    root.className = "orisan-guard";
    anchor.insertAdjacentElement("afterend", root);
  }
  return root;
}

function renderStatus(root: HTMLElement, label: string, message: string, state: GuardRuntimeState, input: { write(value: string): Promise<void> }): void {
  root.replaceChildren();

  const badge = document.createElement("button");
  badge.type = "button";
  badge.className = "orisan-guard__badge";
  badge.textContent = `Guard: ${message}`;
  root.appendChild(badge);

  const result = state.lastResult;
  if (!result || result.decision === "allow") return;

  const panel = document.createElement("div");
  panel.className = "orisan-guard__panel";

  const title = document.createElement("div");
  title.className = "orisan-guard__title";
  title.textContent = `${label} protection`;
  panel.appendChild(title);

  const summaryText = document.createElement("p");
  summaryText.textContent = summary(result);
  panel.appendChild(summaryText);

  const preview = document.createElement("textarea");
  preview.className = "orisan-guard__preview";
  preview.readOnly = true;
  preview.value = result.rewrittenText;
  panel.appendChild(preview);

  if (result.decision !== "block") {
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "orisan-guard__action";
    apply.textContent = "Apply safe version";
    apply.addEventListener("click", () => {
      void input.write(result.rewrittenText);
    });
    panel.appendChild(apply);
  }

  if (result.decision === "block") {
    const block = document.createElement("p");
    block.className = "orisan-guard__block";
    block.textContent = "Strict policy blocked this prompt from being sent raw.";
    panel.appendChild(block);
  }

  root.appendChild(panel);
}

function summary(result: AnalysisResult): string {
  const total = result.spans.length;
  if (total === 0) return "No sensitive context detected";
  const classes = Object.entries(result.protectedCounts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${count} ${name.replaceAll("_", " ")}`)
    .join(", ");
  if (result.decision === "block") {
    return `Blocked high-risk content: ${classes}`;
  }
  return `Protected ${total} item${total === 1 ? "" : "s"}: ${classes}`;
}


function renderUnsupported(adapter: SiteAdapter): void {
  const root = document.createElement("div");
  root.id = "orisan-guard-root";
  root.className = "orisan-guard orisan-guard--unsupported";
  root.textContent = `Guard: ${adapter.label} unsupported or changed page structure`;
  document.documentElement.appendChild(root);
}

function debounce(callback: () => Promise<void>, delayMs: number): () => void {
  let timeout: number | undefined;
  return () => {
    if (timeout !== undefined) window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      void callback();
    }, delayMs);
  };
}
