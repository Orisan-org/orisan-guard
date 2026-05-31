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
- include a browser extension yet
- include cloud sync or a control plane

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
