import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";

describe("rewrite engine", () => {
  it("preserves line breaks and stable placeholders", async () => {
    const result = await analyze({
      text: "jane@example.com\njane@example.com",
      surface: "browser",
      destination: "local_fixture",
      mode: "auto_protect",
      policy: defaultPolicy
    });

    expect(result.rewrittenText).toBe("EMAIL_1\nEMAIL_1");
  });

  it("does not redact public company names in benign prompts", async () => {
    const result = await analyze({
      text: "Compare Stripe and Adyen checkout tradeoffs.",
      surface: "browser",
      destination: "local_fixture",
      mode: "assist",
      policy: defaultPolicy
    });

    expect(result.decision).toBe("allow");
    expect(result.rewrittenText).toContain("Stripe");
  });
});
