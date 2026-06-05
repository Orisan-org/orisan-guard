import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";

describe("PII detection", () => {
  it("replaces emails and phone numbers with placeholders", async () => {
    const result = await analyze({
      text: "Email jane.customer@example.com or call 415-555-1212.",
      surface: "browser",
      destination: "local_fixture",
      mode: "auto_protect",
      policy: defaultPolicy
    });

    expect(result.rewrittenText).toContain("EMAIL_1");
    expect(result.rewrittenText).toContain("PHONE_1");
    expect(result.rewrittenText).not.toContain("jane.customer@example.com");
  });
});
