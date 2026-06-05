# 0001: Guard Redaction Separate Tool

Date: 2026-06-05

Status: Accepted for this implementation

## Decision

Build Guard Phase 1 as a separate open-source portfolio/community project in its own repository.

Guard must not be mixed into MCP Scanner. MCP Scanner remains the active Orisan product-discovery wedge.

## Scope

Phase 1 is a local-first Chrome Manifest V3 browser extension with a reusable TypeScript core. It protects typed and pasted prompt text before submission to supported AI chat surfaces.

## Non-goals

- SaaS dashboard
- Cloud upload
- Telemetry
- Raw prompt storage
- MCP scanning
- Scout inventory
- Relay runtime action governance
- Review output validation
- Enterprise policy sync
- Broad browser support claims

## Rationale

Guard's value moment is pre-send protection inside AI chat surfaces. Building it as a separate tool preserves product boundaries and avoids confusing Guard with MCP Scanner.

## Release Gate

This is not a production release and not a finalized startup product. It requires unit tests, extension build, lint, typecheck, adapter tests, Playwright extension tests, and manual security review before public use.
