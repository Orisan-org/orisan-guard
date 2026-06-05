import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";

describe("internal context detection", () => {
  it("generalizes internal hosts and placeholders private IPs", async () => {
    const result = await analyze({
      text: "payments-prod.internal called 10.2.4.8 during checkout.",
      surface: "browser",
      destination: "local_fixture",
      mode: "auto_protect",
      policy: defaultPolicy
    });

    expect(result.rewrittenText).toContain("an internal service");
    expect(result.rewrittenText).toContain("PRIVATE_IP_1");
  });
});
