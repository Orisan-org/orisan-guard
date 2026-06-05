import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";
import { privateKeyPrompt, syntheticSecret } from "../fixtures/prompts";

describe("policy modes", () => {
  it("assist mode asks for high-risk transformations", async () => {
    const result = await analyze({
      text: syntheticSecret,
      surface: "browser",
      destination: "local_fixture",
      mode: "assist",
      policy: defaultPolicy
    });

    expect(result.decision).toBe("ask");
  });

  it("auto-protect transforms automatically", async () => {
    const result = await analyze({
      text: syntheticSecret,
      surface: "browser",
      destination: "local_fixture",
      mode: "auto_protect",
      policy: defaultPolicy
    });

    expect(result.decision).toBe("transform");
  });

  it("strict mode blocks private keys", async () => {
    const result = await analyze({
      text: privateKeyPrompt,
      surface: "browser",
      destination: "local_fixture",
      mode: "strict",
      policy: defaultPolicy
    });

    expect(result.decision).toBe("block");
  });
});
