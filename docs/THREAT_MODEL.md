# Guard Threat Model

## Assets

- Raw prompt text
- Detected sensitive spans
- Custom term dictionary
- Local evidence metadata
- Extension settings
- Injected UI state

## Trust Boundaries

- AI web page DOM is untrusted.
- Content script is exposed to hostile DOM conditions.
- Service worker is more trusted than content script.
- Guard core is trusted local logic.
- `chrome.storage.local` is local but not a high-security secret vault.

## Threats

1. Raw prompt leaks through evidence.
2. Raw prompt leaks through console logs.
3. Content script sends raw prompt to the wrong receiver.
4. Page manipulates DOM to bypass detection.
5. Page changes editor after Guard verification.
6. Extension injects unsafe HTML and creates XSS.
7. Malicious page sends crafted messages to service worker.
8. Adapter submits raw prompt due to selector drift.
9. Custom terms reveal sensitive company names if exported.
10. User thinks unsupported site is protected.
11. Critical secrets are transformed too weakly.
12. Evidence becomes sensitive because counts/classes reveal business context.

## Controls

1. No raw prompt persistence.
2. No remote calls.
3. No console logging raw text.
4. Final pre-send verification.
5. Strict message schema validation.
6. Sender validation.
7. Use DOM APIs and React escaping, not `innerHTML`.
8. Minimal permissions.
9. Site support status visible.
10. Local evidence clear button.
11. Unit tests for redaction and evidence.
12. Playwright tests for raw prompt not submitted.

## Deferred

- PDF parsing
- Rich files
- Voice/audio
- Cloud processing
- Enterprise policy sync
- Runtime action governance
