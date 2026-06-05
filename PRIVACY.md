# Privacy

Guard processes prompt text locally by default.

Guard does not:

- Upload raw prompts to Orisan.
- Upload findings to Orisan.
- Store raw prompts by default.
- Store safe rewritten prompts by default.
- Store full sensitive values.
- Store redaction maps.
- Call external AI providers for verdicts.
- Use telemetry or analytics.

Local evidence may store:

- Event ID
- Timestamp
- Destination
- Mode
- Detected class counts
- Strategies used
- Decision
- Latency
- `payloadStored=false`
- `originalTextStored=false`
- `rewrittenTextStored=false`

Users can clear local evidence from the options page.
