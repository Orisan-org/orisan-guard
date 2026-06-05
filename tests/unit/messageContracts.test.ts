import { describe, expect, it } from "vitest";
import { messageSchema } from "../../src/extension/messaging/contracts";

describe("message contracts", () => {
  it("rejects unknown privileged actions", () => {
    expect(messageSchema.safeParse({ action: "DELETE_HISTORY", text: "x" }).success).toBe(false);
  });

  it("accepts analyze text messages", () => {
    expect(messageSchema.safeParse({ action: "ANALYZE_TEXT", text: "hello", destination: "local_fixture" }).success).toBe(true);
  });
});
