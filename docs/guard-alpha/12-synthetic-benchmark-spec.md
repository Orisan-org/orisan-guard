# Guard Alpha Synthetic Benchmark Spec

## Purpose

The synthetic benchmark is the contract future Guard Alpha classifier and
redactor work must satisfy. It prevents implementation from optimizing for easy
demo cases while missing real-world prompt redaction failure modes.

## Fixture Location

```text
tests/fixtures/guard_alpha/
  README.md
  manifest.json
  inputs/
```

## Manifest Schema

Each fixture entry must include:

- `id`
- `input_path`
- `description`
- `tags`
- `expected.data_classes`
- `expected.confidence`
- `expected.replacement_strategy`
- `expected.evidence_safe_preview`
- future classifier expectations for span-based detections
- `properties.placeholder_collision`
- `properties.syntax_preserving`
- `properties.large_chunking`
- `properties.edited_safe_rescan`

## Required Fixture Classes

The benchmark must include coverage for:

- placeholder collision
- fake secrets
- synthetic secrets
- internal URLs
- hostnames
- syntax-preserving JSON
- syntax-preserving YAML
- syntax-preserving code
- edited safe prompt re-scan
- prompt injection against redaction
- evidence leakage
- large pasted text chunking

## Safety Requirements

- No real secrets.
- No real personal data.
- No real internal infrastructure.
- Use reserved or synthetic domains such as `.invalid`.
- Values must be obviously synthetic when inspected by a human.
- No network calls.
- No raw prompt upload.

## Expected Output Semantics

Expected metadata is descriptive until the classifier exists:

- `data_classes` names the future detection class.
- `confidence` sets the future expected confidence level.
- `replacement_strategy` describes the future redaction strategy.
- `evidence_safe_preview` describes what can be shown without leaking raw
  sensitive text.

Future classifier detections must include start offset, end offset, data class,
confidence, reason, replacement strategy, and evidence safety level. They must
not store raw matched values. Evidence generated from detections must be safe to
record with `payload_stored=false`.

## Test Scaffold Requirements

The initial scaffold must prove:

- the manifest loads and validates
- every fixture input exists
- fixtures are marked synthetic
- required tags are covered
- placeholder collision cases are represented
- syntax-preserving cases are represented

Classifier accuracy, span offsets, replacement output, and latency should be
added only after the benchmark contract is stable.

## Replacement and Placeholder Requirements

Placeholder generation is not part of classifier v0, but the benchmark requires
future replacement work to be collision-resistant and syntax-preserving for JSON,
YAML, and code snippets.

The placeholder generator is a separate step before full redaction. It may build
replacement plans from classifier detections, but it must not mutate prompt text
or perform syntax-aware replacement. Generated placeholders must be
deterministic, must avoid collisions with user-authored placeholder-looking
content, and must not contain raw matched values.

The first redactor may apply a placeholder plan to text only after classifier
spans and placeholder generation are validated. It must apply replacements using
byte spans from the end of the input toward the beginning so earlier offsets
remain stable. Syntax-aware behavior begins with preserving valid JSON and the
shape of YAML/code string literals; browser/editor offset mapping remains out of
scope.

A local engine may compose classifier, placeholder planner, and redactor results
for tests or future callers. The engine must remain local-only, return
`payload_stored=false`, and must not add browser, network, cloud, or LLM
dependencies.

A benchmark harness may run the local engine across all synthetic fixtures to
check fixture coverage, missing expected classes, payload storage invariants, and
syntax-preservation smoke checks. The harness is for local validation only and
must not upload fixture text or results.

Harness reporting should summarize fixture status and class coverage without
including raw or redacted fixture bodies. Reports are approval artifacts for the
benchmark itself, not prompt evidence records.
