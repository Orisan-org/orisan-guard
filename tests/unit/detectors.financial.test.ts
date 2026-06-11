import { describe, expect, it } from "vitest";
import { analyze, defaultPolicy } from "../../src/core";

async function scan(text: string) {
  return analyze({
    text,
    surface: "browser",
    destination: "local_fixture",
    mode: "auto_protect",
    policy: defaultPolicy,
  });
}

describe("financial and government identifier detection", () => {
  it.each([
    ["My SSN is 123-45-6789.", "123-45-6789", "SSN_1"],
    ["ssn: 123456789", "123456789", "SSN_1"],
    [
      "Card 4111 1111 1111 1111 exp 12/27",
      "4111 1111 1111 1111",
      "PAYMENT_CARD_1",
    ],
    ["4111-1111-1111-1111", "4111-1111-1111-1111", "PAYMENT_CARD_1"],
    ["Amex 378282246310005", "378282246310005", "PAYMENT_CARD_1"],
    ["5555555555554444", "5555555555554444", "PAYMENT_CARD_1"],
    ["2223003122003222", "2223003122003222", "PAYMENT_CARD_1"],
    ["6011111111111117", "6011111111111117", "PAYMENT_CARD_1"],
  ])("replaces %s", async (text, rawValue, placeholder) => {
    const result = await scan(text);

    expect(result.rewrittenText).toContain(placeholder);
    expect(result.rewrittenText).not.toContain(rawValue);
  });

  it.each([
    "Call 415-555-1212",
    "000-12-3456",
    "666-12-3456",
    "912-34-5678",
    "123-00-4567",
    "123-45-0000",
    "order 123456789",
    "123-45 6789",
    "4111111111111112",
    "1234567812345678",
    "Tracking 9999999999999999",
    "41111111111111112222",
  ])("does not classify %s as SSN or payment card", async (text) => {
    const result = await scan(text);

    expect(result.spans.some((span) => span.class === "ssn")).toBe(false);
    expect(result.spans.some((span) => span.class === "payment_card")).toBe(
      false,
    );
  });

  it("replaces email, SSN, and payment card values together", async () => {
    const email = "jane.customer@example.com";
    const ssn = "123-45-6789";
    const card = "4111 1111 1111 1111";
    const result = await scan(
      `Email ${email}. My SSN is ${ssn}. Card ${card}.`,
    );

    expect(result.rewrittenText).toContain("EMAIL_1");
    expect(result.rewrittenText).toContain("SSN_1");
    expect(result.rewrittenText).toContain("PAYMENT_CARD_1");
    expect(result.rewrittenText).not.toContain(email);
    expect(result.rewrittenText).not.toContain(ssn);
    expect(result.rewrittenText).not.toContain(card);
  });
});
