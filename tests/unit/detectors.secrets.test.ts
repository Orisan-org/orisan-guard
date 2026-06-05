import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";
import { privateKeyPrompt, syntheticSecret } from "../fixtures/prompts";

describe("secret detection", () => {
  it("detects and masks synthetic GitHub tokens without exposing the full token in previews", async () => {
    const result = await analyze({
      text: `token=${syntheticSecret}`,
      surface: "browser",
      destination: "local_fixture",
      mode: "assist",
      policy: defaultPolicy
    });

    expect(result.spans.some((span) => span.detectorId === "GUARD-SECRET-001")).toBe(true);
    expect(result.rewrittenText).not.toContain(syntheticSecret);
    expect(result.spans.map((span) => span.preview).join(" ")).not.toContain(syntheticSecret);
  });

  it("treats private keys as critical block candidates", async () => {
    const result = await analyze({
      text: privateKeyPrompt,
      surface: "browser",
      destination: "local_fixture",
      mode: "strict",
      policy: defaultPolicy
    });

    expect(result.decision).toBe("block");
    expect(result.spans.some((span) => span.class === "private_key" && span.severity === "critical")).toBe(true);
  });

  it("detects database URLs with credentials", async () => {
    const dbUrl = "postgres://user:pass@prod-db.internal/app";
    const result = await analyze({
      text: dbUrl,
      surface: "browser",
      destination: "local_fixture",
      mode: "auto_protect",
      policy: defaultPolicy
    });

    expect(result.spans.some((span) => span.class === "database_url")).toBe(true);
    expect(result.rewrittenText).not.toContain("user:pass");
  });
});
