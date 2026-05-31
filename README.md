# Orisan Guard

Orisan Guard is the sensitive-context protection product from Orisan.

Guard asks a different question than Scout:

> Can this prompt or context be safely sent to an AI tool?

This repository contains the early local core for Guard Alpha:

- deterministic classifier
- collision-resistant placeholder planner
- syntax-preserving redactor
- synthetic benchmark fixtures
- benchmark harness and docs
- inert browser extension scaffold with no permissions

## Product Boundary

Guard is not Scout.

Scout answers:

> What can AI coding agents in this repo read, execute, or change?

Guard answers:

> Can this prompt/context be safely sent to an AI tool?

Scout remains a Go CLI for repo-local AI-agent approval evidence. Guard will evolve toward local sensitive-context protection for AI tools, likely including a browser extension and local redaction runtime.

## Current Scope

The current Guard Alpha core is local-only.

It does not:

- upload raw prompts
- call an LLM
- call a cloud service
- include active browser interception yet
- include cloud sync or a control plane

## Extension Scaffold

The `extension/` directory contains a Manifest V3 shell only.

It has:

- no host permissions
- no content scripts
- no prompt interception
- no cloud upload
- no externally connectable surface

The Go test suite includes an extension policy test that fails if host permissions, content scripts, or external connection settings are added accidentally.

## Verify

```bash
go test ./...
go vet ./...
```

Run the synthetic benchmark harness:

```bash
go run ./cmd/guard-alpha-benchmark \
  --markdown /tmp/guard-alpha-benchmark.md \
  --json /tmp/guard-alpha-benchmark.json
```

Expected current gate:

- 11 fixtures
- 0 missing-class fixtures
- 0 payload-storage violations
- 0 evidence-count violations
- 0 hash-missing violations

Run local redaction on one file:

```bash
go run ./cmd/guard-alpha-redact \
  --input /path/to/input.txt \
  --output /tmp/guard-redacted.txt \
  --json /tmp/guard-evidence.json
```

Or pipe text through stdin:

```bash
printf 'token=synthetic-token-000000000000' | go run ./cmd/guard-alpha-redact
```

The JSON evidence includes hashes, detections, placeholders, counts, and `payload_stored=false`. It must not contain raw prompt values.

## Tracker

Guard alpha core next steps are tracked here:

```text
https://github.com/Orisan-org/orisan-guard/issues/1
```
