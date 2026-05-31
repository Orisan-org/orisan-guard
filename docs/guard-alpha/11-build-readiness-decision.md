# Guard Alpha Build Readiness Decision

## Decision

Guard Alpha is not ready for classifier implementation until the repo-local
benchmark contract exists and passes tests.

The correct order is:

1. Reconcile Guard Alpha docs into the actual working repository.
2. Add synthetic benchmark fixtures and expected output metadata.
3. Add test scaffolding that validates benchmark coverage.
4. Only then build the span-based local classifier against the benchmark.

## Approved Now

- Synthetic fixtures.
- Expected labels and metadata.
- Manifest loader and validator.
- Tests proving coverage for placeholder collision and syntax preservation.
- Tests proving all fixture inputs exist and are synthetic.

## Not Approved Yet

- Browser extension.
- Cloud sync.
- Control plane.
- Raw prompt upload.
- Classifier implementation before the benchmark scaffold is present.
- Redactor implementation.
- Network calls.

## Readiness Gate

The benchmark phase is considered complete when:

- all named edge-case classes are represented
- expected data classes are present per fixture
- confidence expectations are present per fixture
- replacement strategy expectations are present per fixture
- evidence-safe preview expectations are present per fixture
- fixture tests pass in `go test ./...`

The next approved step after this gate is a span-based local classifier that
emits detections without redacting text or generating placeholders.

## Current Status

The first benchmark scaffold has been added under `tests/fixtures/guard_alpha`
with a Go loader and structural tests under `internal/benchmark`.

Known gap: the benchmark validates coverage and structure, but it does not yet
evaluate classifier spans, redacted output, syntax preservation, or latency.

## Classifier Readiness Requirements

Before placeholder or redaction work begins, classifier v0 must prove:

- every detection has valid start and end offsets
- confidence is populated
- replacement strategy is populated
- evidence safety level is populated
- raw matched payloads are not stored
- fake/example secrets are lower confidence than real-looking synthetic secrets
