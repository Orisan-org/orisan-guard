# orisan-guard - Finish-and-Park Plan (v0.1.1)

**Repo:** github.com/Orisan-org/orisan-guard
**Mission:** Bring guard to the honest finish bar, then freeze it. Nothing more.
**Definition of "finished":** the headline flow works on real input AND every README/site claim is true.
**This is NOT a feature build.** Guard is a parked experiment. These slices close detector gaps that make current claims dishonest, align public claims with reality, and tag a frozen release.

---

## 0. Hard guardrails (read first, obey throughout)

1. **Do not** add new site adapters, change `wxt.config.ts` host permissions, or touch anything under `src/adapters/` or `entrypoints/`.
1. **Do not** add npm dependencies. Everything below is doable with the existing stack.
1. **Do not** add features beyond this plan (no international phone, no IBAN, no passport numbers, no ML models, no prompt optimization). If you think something extra is needed, write it in the final summary instead of building it.
1. **Do not** weaken privacy invariants: no raw values in logs, evidence, or test snapshots beyond hashed/preview forms already used by `makeSpan` (`originalHash` + `safePreview`).
1. All existing tests must keep passing. New code must pass `pnpm typecheck`, `pnpm lint`, `pnpm test`.
1. Work in three commits, one per slice, with the commit messages given below.

**Environment facts:** pnpm 10 (`packageManager` pinned), TypeScript strict, Vitest for unit tests (`pnpm test`), Playwright e2e exists (`pnpm e2e`) but is **optional** - run it only if browsers are already installed; do not install browsers or modify CI for it.

---

## Slice 1 - Detector floor: SSN + payment card

### 1.1 Add sensitivity classes

File: `src/core/models/policy.ts`

- Extend the `SensitivityClass` union with `"ssn"` and `"payment_card"` (place them after `"phone"`).
- Add both to the `allSensitivityClasses` array in the same position.
- No other policy changes. `defaultPolicy.enabledClasses` already spreads `allSensitivityClasses`, so both are enabled by default automatically.

### 1.2 Add placeholder labels

File: `src/core/transform/placeholders.ts`

Add to the `labels` map:

```ts
ssn: "SSN",
payment_card: "PAYMENT_CARD",
```

### 1.3 Create validators

New file: `src/core/detectors/validators.ts`

```ts
/** Luhn checksum over a digits-only string. */
export function luhnValid(digits: string): boolean;
```

- Standard Luhn: from rightmost digit, double every second digit, subtract 9 if > 9, sum % 10 === 0.
- Return `false` for strings shorter than 12, longer than 19, or containing non-digits.

```ts
/** SSN structural validity: area not 000/666/900-999, group not 00, serial not 0000. */
export function ssnStructureValid(
  area: string,
  group: string,
  serial: string,
): boolean;
```

```ts
/** Known payment-card IIN prefix check on a digits-only string. */
export function knownCardPrefix(digits: string): boolean;
```

Accept these prefixes (and only these):

- `4` (Visa, length 13/16/19)
- `51`-`55` and `2221`-`2720` (Mastercard, length 16)
- `34`, `37` (Amex, length 15)
- `6011`, `64`-`65` (Discover, length 16-19)
- `35` (JCB, length 16-19)
- `30`, `36`, `38` (Diners, length 14-19)

Enforce the length constraint per prefix family as listed.

### 1.4 Extend the PII detector

File: `src/core/detectors/pii.ts` - follow the existing pattern exactly (`collectMatches` + `makeSpan`). Two additions:

**SSN - detector id `GUARD-PII-004`, class `ssn`, severity `high`, strategy `placeholder`.**

Two match paths:

1. Delimited: `/\b(\d{3})([- ])(\d{2})\2(\d{4})\b/g` (same delimiter both positions - `123-45 6789` must NOT match). Keep only matches passing `ssnStructureValid`. Confidence `0.9`. Reason: `"US Social Security Number pattern detected."`
1. Bare 9 digits: `/\b\d{9}\b/g`, kept **only if** the 40 characters preceding the match (case-insensitive) contain `ssn` or `social security`, and `ssnStructureValid` passes on (first 3, next 2, last 4). Confidence `0.8`. Same reason text.

If both paths match the same offsets, emit one span (delimited path wins). Dedupe by `start:end`.

**Payment card - detector id `GUARD-PII-005`, class `payment_card`, severity `critical`, strategy `placeholder`.**

1. Candidate regex: `/\b(?:\d[ -]?){11,18}\d\b/g`
1. For each candidate: strip spaces/hyphens -> digits. Keep only if `luhnValid(digits)` AND `knownCardPrefix(digits)` (which also enforces length).
1. Span boundaries are the full matched text including separators. Confidence `0.95`. Reason: `"Payment card number detected (Luhn-validated)."`

### 1.5 Unit tests

New file: `tests/unit/detectors.financial.test.ts` - mirror the style of `tests/unit/detectors.pii.test.ts` (call `analyze` with `defaultPolicy`, `mode: "auto_protect"`, `destination: "local_fixture"`).

Must-pass positives (assert placeholder appears AND raw value absent from `rewrittenText`):

| Input                                | Expect                                 |
| ------------------------------------ | -------------------------------------- |
| `My SSN is 123-45-6789.`             | `SSN_1`, raw absent                    |
| `ssn: 123456789`                     | `SSN_1`, raw absent                    |
| `Card 4111 1111 1111 1111 exp 12/27` | `PAYMENT_CARD_1`, raw absent           |
| `4111-1111-1111-1111`                | `PAYMENT_CARD_1`                       |
| `Amex 378282246310005`               | `PAYMENT_CARD_1`                       |
| `5555555555554444`                   | `PAYMENT_CARD_1`                       |
| `2223003122003222`                   | `PAYMENT_CARD_1` (2-series Mastercard) |
| `6011111111111117`                   | `PAYMENT_CARD_1`                       |

Must-pass negatives (assert NO `ssn`/`payment_card` span; other detectors may still fire, that is fine):

| Input                                                                     | Why it must not match                      |
| ------------------------------------------------------------------------- | ------------------------------------------ |
| `Call 415-555-1212`                                                       | phone shape, not SSN shape                 |
| `000-12-3456`, `666-12-3456`, `912-34-5678`, `123-00-4567`, `123-45-0000` | SSN structure invalid                      |
| `order 123456789` (no SSN context word)                                   | bare 9 digits without context              |
| `123-45 6789`                                                             | mixed delimiters                           |
| `4111111111111112`                                                        | Luhn fail                                  |
| `1234567812345678`                                                        | unknown prefix + Luhn fail                 |
| `Tracking 9999999999999999`                                               | unknown prefix                             |
| `41111111111111112222` (20+ digit run)                                    | no boundary match inside longer digit runs |

Also add one combined test: text containing an email, an SSN, and a card yields `EMAIL_1`, `SSN_1`, `PAYMENT_CARD_1` simultaneously and none of the raw values survive in `rewrittenText`.

**Decision pre-answered:** if a card number also triggers `GUARD-PII-003` (contextual identifier, e.g. `account: 4111111111111111`), overlapping spans are acceptable as long as the raw number does not appear in `rewrittenText`. Assert on absence of the raw value, not on span exclusivity.

**Commit 1:** `feat(detectors): add SSN and payment card detection with structural + Luhn validation`

---

## Slice 2 - Honest claims

### 2.1 README (this repo)

File: `README.md`

1. In **Status**, append: guard is a **parked experiment**; active Orisan development is on [mcpscan](https://github.com/Orisan-org/mcpscan); guard receives no feature work, only honesty fixes.
1. If any section lists detected classes/coverage, add SSN and payment card to it. If no such list exists, add a short **What Guard Detects** subsection: emails, phone numbers (North American formats only), contextual customer/account identifiers, US SSNs, payment card numbers (Luhn-validated), secrets (GitHub/AWS/key material per `secrets.ts`), internal hostnames/URLs/IPs, user-defined custom terms. State explicitly: detection is pattern-based, not ML; names, addresses, and freeform PII are **not** detected.
1. Keep the Supported Sites table as is (it is already honest).

### 2.2 Site repo (only if `orisan-site` is present in the workspace)

Repo: `Orisan-org/site` (orisan-site). If it is not checked out in this workspace, **skip this section entirely** and flag it in the final summary as a manual follow-up.

File: `app/guard/page.tsx`

1. Add a visible status banner at the top of the page: "Guard is a parked experiment. It is not under active development." Reuse whatever alert/badge component the site already uses elsewhere.
1. Remove or disable the install CTA (per audit it points at the mcpscan repo, which is wrong twice over). Replace with a single link to the guard GitHub repo labeled "View source on GitHub".
1. Ensure the page states the real scope: ChatGPT-only experimental adapter, pattern-based detection.
1. Touch nothing else on the site (founder links, scout install command are out of scope for this plan).

**Commit 2:** `docs: align guard claims with reality (parked status, detection scope)`

---

## Slice 3 - Freeze

1. Bump `package.json` version to `0.1.1`.
1. Create `CHANGELOG.md`:

- `0.1.1` - added SSN + payment card detectors; documented parked status and honest detection scope.
- `0.1.0` - initial prototype (ChatGPT experimental adapter, local-first core, placeholder rewrite, evidence metadata with payload_stored=false).

1. Final verification gate, all must pass: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. The `wxt build` output must produce the extension bundle with zero errors.
1. **Commit 3:** `chore(release): v0.1.1 - detector floor complete, project parked`
1. Do not push tags automatically. In the final summary, print the exact commands for the human to run: `git tag v0.1.1 && git push origin main --tags`.

---

## Pre-answered questions (do not stop to ask these)

- **Should SSN also match without context when bare?** No. Bare 9-digit numbers without `ssn`/`social security` context are too false-positive-prone (order numbers, ZIP+routing fragments).
- **Should I validate card expiry/CVV nearby?** No. Luhn + prefix + length is the v0.1.1 bar.
- **International phones, IBANs, passports?** Out of scope. Note in summary if you feel strongly.
- **New `Severity` values or strategies?** No. Use existing `high` / `critical` / `placeholder`.
- **Should evidence or tests ever contain a full card/SSN value?** Test fixtures may contain the synthetic test numbers above (they are industry-standard test values). Evidence records must continue to store only `originalHash` + `preview` via `makeSpan` - do not change that path.
- **e2e tests failing because no browser is installed?** Skip e2e; unit + typecheck + lint + build are the gate.
- **Something in the existing code looks wrong/improvable?** Leave it. Note it in the summary. This project is being parked, not polished.

## Final deliverable

A summary listing: files changed per slice, test count before/after, the verification gate output, anything skipped (e.g. site repo absent), and the manual tag command.
