# Codex Prompt: Guard Alpha Edge Cases First

You are working on Orisan Guard Alpha.

Before implementing the classifier, read:

- `docs/guard-alpha/10-edge-cases-and-performance-design.md`
- `docs/guard-alpha/04-latency-redaction-design.md` when present
- `docs/guard-alpha/05-evidence-metrics.md` when present
- `docs/guard-alpha/06-threat-model.md` when present
- `docs/guard-alpha/11-build-readiness-decision.md`
- `docs/guard-alpha/12-synthetic-benchmark-spec.md`

Goal:
Create the synthetic redaction benchmark and implementation scaffolding so Guard
Alpha handles real-world edge cases before classifier work begins.

Do not build the browser extension yet.
Do not build cloud sync.
Do not build the control plane.
Do not upload raw prompts.

Implement or scaffold only:

1. synthetic benchmark fixtures covering:

   - placeholder collision
   - fake secrets
   - real-looking synthetic secrets
   - internal URLs and hostnames
   - valid JSON/YAML/code snippets requiring syntax-preserving redaction
   - edited safe prompt re-scan cases
   - prompt injection against redaction
   - evidence leakage checks
   - large pasted text chunking cases

2. expected output metadata for each fixture:

   - expected data classes
   - expected confidence
   - expected replacement strategy
   - expected evidence-safe preview behavior

3. test harness structure for future classifier/redactor tests.

Acceptance criteria:

- No real secrets or real personal data.
- All test values are synthetic.
- Fixtures include expected labels.
- Tests or test scaffold prove placeholder collision cases are represented.
- Tests or test scaffold prove syntax-preserving replacement cases are represented.
- No network calls.
- Future classifier detections must be span-based.
- Evidence must be safe to store with `payload_stored=false`.

Output:

- files changed
- fixtures added
- tests/scaffolding added
- known gaps
