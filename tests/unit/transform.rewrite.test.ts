import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";

describe("rewrite engine", () => {
  it("preserves line breaks and stable placeholders", async () => {
    const result = await analyze({
      text: "jane@example.com\njane@example.com",
      surface: "browser",
      destination: "local_fixture",
      mode: "auto_protect",
      policy: defaultPolicy,
    });

    expect(result.rewrittenText).toBe("EMAIL_1\nEMAIL_1");
  });

  it("does not redact public company names in benign prompts", async () => {
    const result = await analyze({
      text: "Compare Stripe and Adyen checkout tradeoffs.",
      surface: "browser",
      destination: "local_fixture",
      mode: "assist",
      policy: defaultPolicy,
    });

    expect(result.decision).toBe("allow");
    expect(result.rewrittenText).toContain("Stripe");
  });

  it("keeps risky troubleshooting rewrites shorter and payload-safe", async () => {
    const prompt = `Please debug this production issue:

DATABASE_URL=postgres://billing_admin:SuperSecret123@billing-db.prod.orisan.internal:5432/billing
The app server at 10.42.8.19 cannot connect.

Here is the key:

-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----

Contact admin@orisan.internal.
Ticket: INC-48291`;
    const forbidden = [
      "SuperSecret123",
      "billing_admin",
      "postgres://",
      "billing-db.prod.orisan.internal",
      "10.42.8.19",
      "admin@orisan.internal",
      "BEGIN PRIVATE KEY",
    ];

    const result = await analyze({
      text: prompt,
      surface: "browser",
      destination: "local_fixture",
      mode: "assist",
      policy: defaultPolicy,
    });

    expect(result.decision).toBe("ask");
    expect(result.rewrittenText.length).toBeLessThan(prompt.length);
    expect(result.rewrittenText).toContain("production issue");
    expect(result.rewrittenText).toContain("cannot connect");
    for (const value of forbidden) {
      expect(result.rewrittenText).not.toContain(value);
    }
  });
});
