import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";
import { syntheticSecret } from "../fixtures/prompts";

describe("evidence safety", () => {
  it("never stores raw prompt or rewritten prompt in evidence", async () => {
    const result = await analyze({
      text: `token=${syntheticSecret}`,
      surface: "browser",
      destination: "local_fixture",
      mode: "auto_protect",
      policy: defaultPolicy
    });

    const serialized = JSON.stringify(result.evidence);
    expect(result.evidence.payloadStored).toBe(false);
    expect(result.evidence.originalTextStored).toBe(false);
    expect(result.evidence.rewrittenTextStored).toBe(false);
    expect(serialized).not.toContain(syntheticSecret);
    expect(serialized).not.toContain("REDACTED_TOKEN");
  });
});
