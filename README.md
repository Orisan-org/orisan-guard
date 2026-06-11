# Orisan Guard

Orisan Guard is a local-first browser extension experiment that protects sensitive context before it is sent to AI tools.

It detects sensitive values in typed or pasted prompt text, creates a safer rewrite, and shows what was protected before submission.

## Status

Guard is an early open-source prototype. It is not production-ready, and its browser-site coverage is intentionally limited while the extension architecture and local rewrite flow are tested.

Guard is now a parked experiment. Active Orisan development is on [mcpscan](https://github.com/Orisan-org/mcpscan); Guard receives no feature work, only honesty fixes.

## What Guard Is

- A Chrome Manifest V3 browser extension.
- A reusable local TypeScript core engine.
- A local text protection layer for AI prompt boxes.
- A safe rewrite workflow with final pre-send verification.
- A local evidence metadata generator with `payload_stored=false`.

## What Guard Is Not

Guard is not a SaaS dashboard, a generic DLP replacement, an enterprise policy console, or a cloud prompt-processing service.

Phase 1 does not protect PDFs, screenshots, voice input, rich file uploads, unsupported sites, or every AI chat website.

## What Guard Detects

Guard uses deterministic, pattern-based detection for:

- Emails
- Phone numbers in North American formats
- Contextual customer/account identifiers
- US Social Security Numbers
- Payment card numbers with Luhn validation and known card prefixes
- Secrets such as GitHub tokens, AWS access-key IDs, bearer/JWT-like tokens, private key material, database URLs with credentials, webhook URLs, and secret-like config assignments
- Internal hostnames, URLs, private IPs, and local/internal paths
- User-defined custom terms

Guard does not use ML for detection. It does not detect names, addresses, or freeform PII.

## Privacy

Guard analyzes prompt text locally in the browser extension. It does not upload raw prompts to Orisan. It does not store raw prompts by default.

Local evidence stores only metadata such as detected classes, counts, strategies used, decisions, latency, and:

- `payloadStored=false`
- `originalTextStored=false`
- `rewrittenTextStored=false`

Guard must not store raw prompts, rewritten prompts, full sensitive values, or redaction maps by default.

## Supported Sites

| Site                       | Status                              |
| -------------------------- | ----------------------------------- |
| Local fixture page         | Supported for development and tests |
| ChatGPT                    | Experimental adapter                |
| Claude, Gemini, Perplexity | Deferred                            |

If a site adapter is unsupported or broken, Guard should say so instead of silently claiming protection.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for local build and test commands.

## How Protection Works

1. A content script observes a supported prompt box.
2. Typed or pasted text is sent to the extension service worker.
3. The service worker loads local settings and runs the Guard core engine.
4. Guard returns a safe rewrite and protection summary.
5. The user applies the safe version, or auto-protect applies it based on mode.
6. Final pre-send verification runs immediately before submission.
7. The AI site receives only the verified safe version.

## Limitations

Guard Phase 1 supports typed and pasted text only. It does not protect PDFs, screenshots, voice input, rich file uploads, browser history, unsupported AI sites, or channels Guard cannot inspect before submission.

ChatGPT support is experimental because AI site DOMs change frequently. The local fixture adapter is the source-of-truth test surface.

## Current Scope

Implemented in this prototype:

- Local core engine
- Chrome extension
- Local fixture adapter
- Experimental ChatGPT adapter
- Typed/pasted text only
- Assist, auto-protect, strict, and custom modes
- Safe rewrite preview
- Final pre-send verification
- Local evidence only

Not implemented:

- Cloud detection
- Central dashboard
- Team policy sync
- PDF/DOCX/XLSX support
- Screenshots/OCR
- Voice/audio
- IDE extension
- CLI
- Enterprise evidence export
