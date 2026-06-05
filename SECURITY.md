# Security

Guard is security-sensitive because content scripts run in hostile, complex web pages.

## Security Posture

- Minimal permissions.
- No `<all_urls>`.
- No backend URLs.
- No telemetry.
- No remote rule loading.
- No remote code loading.
- No raw prompt logging.
- No raw prompt persistence.
- No `innerHTML` for user-controlled values.

## Trust Boundaries

- AI web page DOM is untrusted.
- Content script is page-facing and must not be treated as a privileged policy engine.
- Extension service worker validates messages and owns privileged extension behavior.
- Guard core is local trusted logic.
- `chrome.storage.local` is local storage, not a high-security secret vault.

## Reporting

Do not include raw prompts, secrets, private customer text, or redaction maps in security reports.
