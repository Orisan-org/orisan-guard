# Guard Alpha Edge Cases and Performance Design

Guard Alpha is a local prompt-protection and evidence layer. Before classifier
work starts, the repository must contain a synthetic benchmark that represents
the failure modes we expect in real usage.

## Scope

This design covers benchmark fixtures and test scaffolding only. It does not
authorize building the classifier, browser extension, cloud sync, control plane,
or raw prompt upload.

## Edge Cases

The first benchmark slice must cover:

- Placeholder collision: user-authored placeholder-looking text must not collide
  with generated redaction placeholders.
- Fake secrets: documentation examples such as `example`, `changeme`, and
  obviously fake keys must be represented separately from high-confidence
  synthetic secrets.
- Real-looking synthetic secrets: invalid but provider-shaped keys and tokens
  must be available for positive redaction tests.
- Internal URLs and hostnames: local hostnames, `.invalid` domains, private IP
  ranges, ports, and paths must be represented without using real
  infrastructure.
- Syntax-preserving redaction: JSON, YAML, and code examples must remain
  structurally valid or parse-shaped after future replacement.
- Edited safe prompt re-scan: generated placeholders must be idempotent and not
  repeatedly re-redacted.
- Prompt injection against redaction: fixture text may instruct the system to
  reveal or preserve raw values, and the future redactor must ignore those
  instructions.
- Evidence leakage: expected previews must describe what can be shown safely
  without leaking raw prompt data. Evidence records must not store raw matched
  payloads and should be compatible with `payload_stored=false`.
- Large pasted text chunking: synthetic sensitive values must appear near text
  boundaries so future chunking logic can be tested.

## Performance Shape

The benchmark should be structured so future implementation can measure:

- span start/end validity
- total fixture count
- bytes scanned per fixture
- detection count per data class
- redaction latency per fixture
- syntax preservation success
- evidence preview leakage failures
- chunk boundary failures

No performance target is set until the classifier/redactor exists.

## Current Repository Contract

Benchmark fixtures live under:

```text
tests/fixtures/guard_alpha/
```

The manifest is:

```text
tests/fixtures/guard_alpha/manifest.json
```

The current scaffold validates fixture structure only. It intentionally does not
classify or redact.

## Classifier Contract

The first classifier implementation must be local and span-based. Detection and
redaction must stay separate.

Each detection must include:

- start byte offset
- end byte offset
- data class
- confidence
- reason
- replacement strategy
- evidence safety level

Detections must not include raw matched values. A deterministic hash may be
stored for comparison, but evidence must remain payload-safe.

Byte offsets are the internal classifier contract because they are safe for Go
string slicing. Browser and editor integrations will need an adapter that maps
byte spans to rune, UTF-16, or DOM offsets.
