import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";

describe("custom term detection", () => {
  it("keeps custom terms local and rewrites matching prompt text", async () => {
    const result = await analyze({
      text: "acme-bank saw a production incident.",
      surface: "browser",
      destination: "local_fixture",
      mode: "custom",
      policy: {
        ...defaultPolicy,
        customTerms: [{ id: "1", value: "acme-bank", strategy: "placeholder", sensitivityClass: "custom_term" }]
      }
    });

    expect(result.rewrittenText).toContain("CUSTOM_TERM_1");
    expect(result.evidence.detectedClasses.custom_term).toBe(1);
  });
});
