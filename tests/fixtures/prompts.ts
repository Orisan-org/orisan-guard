export const syntheticSecret = "ghp_FAKE1234567890abcdef1234567890abcd";

export const messyLogPrompt = `Customer acme-bank hit error on payments-prod.internal at 10.2.4.8.
Token is ${syntheticSecret}.
Can you debug this stack trace?`;

export const privateKeyPrompt = `Please debug this key:
-----BEGIN PRIVATE KEY-----
FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE
-----END PRIVATE KEY-----`;

export const benignPrompt = "Compare Stripe and Adyen checkout tradeoffs for a public market analysis.";
