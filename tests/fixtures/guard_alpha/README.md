# Guard Alpha Synthetic Redaction Benchmark

These fixtures are synthetic-only examples for future Guard Alpha classifier and
redactor tests. They model edge cases without real secrets, real personal data,
network calls, browser extension behavior, cloud sync, or control-plane logic.

Each fixture has:

- an input file under `inputs/`
- expected data classes
- expected confidence
- expected replacement strategy
- expected evidence-safe preview behavior

The current test harness only validates benchmark structure and coverage. It
does not implement the classifier or redactor.
