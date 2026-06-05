# Development

This document covers local development commands for Orisan Guard.

## Requirements

- Node.js 22
- pnpm
- Chromium dependencies for Playwright extension tests

## Install

```bash
pnpm install
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install --with-deps chromium
pnpm e2e
```

## Local Extension Build

```bash
pnpm build
```

The unpacked Chrome extension is written to:

```text
.output/chrome-mv3
```

Load that directory in Chrome via `chrome://extensions` with Developer Mode enabled.
