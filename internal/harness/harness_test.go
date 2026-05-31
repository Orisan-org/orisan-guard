package harness

import (
	"encoding/json"
	"sort"
	"strings"
	"testing"
)

const manifestPath = "../../tests/fixtures/guard_alpha/manifest.json"

func TestEvaluateCoversEveryBenchmarkFixture(t *testing.T) {
	results, err := Evaluate(manifestPath)
	if err != nil {
		t.Fatalf("Evaluate() error = %v", err)
	}

	if got, want := len(results), 11; got != want {
		t.Fatalf("result count = %d, want %d", got, want)
	}
	for _, result := range results {
		if len(result.MissingClasses) > 0 {
			t.Fatalf("fixture %q missing classes: %v", result.FixtureID, result.MissingClasses)
		}
	}
}

func TestEvaluateFixtureClassesMatchManifestExactly(t *testing.T) {
	results, err := Evaluate(manifestPath)
	if err != nil {
		t.Fatalf("Evaluate() error = %v", err)
	}

	for _, result := range results {
		expectedClasses := append([]string(nil), result.ExpectedClasses...)
		sort.Strings(expectedClasses)
		expected := strings.Join(expectedClasses, ",")
		detected := strings.Join(result.DetectedClasses, ",")
		if detected != expected {
			t.Fatalf("fixture %q detected classes = %v, want %v", result.FixtureID, result.DetectedClasses, expectedClasses)
		}
	}
}

func TestSummarizeReportsReleaseGateCounts(t *testing.T) {
	results, err := Evaluate(manifestPath)
	if err != nil {
		t.Fatalf("Evaluate() error = %v", err)
	}

	summary := Summarize(results)
	if summary.FixtureCount != 11 {
		t.Fatalf("fixture count = %d, want 11", summary.FixtureCount)
	}
	if summary.FixturesWithMissing != 0 {
		t.Fatalf("fixtures with missing classes = %d", summary.FixturesWithMissing)
	}
	if summary.PayloadStoredViolations != 0 {
		t.Fatalf("payload storage violations = %d", summary.PayloadStoredViolations)
	}
	if summary.EvidenceCountViolations != 0 {
		t.Fatalf("evidence count violations = %d", summary.EvidenceCountViolations)
	}
	if summary.HashMissingViolations != 0 {
		t.Fatalf("hash missing violations = %d", summary.HashMissingViolations)
	}

	expectedClasses := []string{
		"api_key_like_value",
		"customer_identifier",
		"database_url",
		"email",
		"internal_hostname",
		"internal_url",
		"ip_address",
		"phone_number",
		"private_key_marker",
		"token_like_value",
	}
	if strings.Join(summary.DetectedClasses, ",") != strings.Join(expectedClasses, ",") {
		t.Fatalf("detected classes = %v, want %v", summary.DetectedClasses, expectedClasses)
	}
}

func TestEvaluateKeepsPayloadStoredFalse(t *testing.T) {
	results, err := Evaluate(manifestPath)
	if err != nil {
		t.Fatalf("Evaluate() error = %v", err)
	}

	for _, result := range results {
		if result.PayloadStored {
			t.Fatalf("fixture %q payload_stored = true", result.FixtureID)
		}
		if result.InputSHA256 == "" || result.RedactedSHA256 == "" {
			t.Fatalf("fixture %q missing hashes: %+v", result.FixtureID, result)
		}
		if result.DetectionCount != result.EvidenceCount {
			t.Fatalf("fixture %q detection/evidence mismatch: %+v", result.FixtureID, result)
		}
	}
}

func TestEvaluatePreservesSyntaxFixtureShape(t *testing.T) {
	results, err := Evaluate(manifestPath)
	if err != nil {
		t.Fatalf("Evaluate() error = %v", err)
	}

	byID := map[string]FixtureResult{}
	for _, result := range results {
		byID[result.FixtureID] = result
	}

	var parsed map[string]any
	if err := json.Unmarshal([]byte(byID["syntax_preserving_json"].RedactedText), &parsed); err != nil {
		t.Fatalf("redacted JSON fixture is invalid: %v", err)
	}
	if !strings.Contains(byID["syntax_preserving_yaml"].RedactedText, "token: {{GUARD_ALPHA_") {
		t.Fatalf("redacted YAML lost token key shape:\n%s", byID["syntax_preserving_yaml"].RedactedText)
	}
	if !strings.Contains(byID["syntax_preserving_code"].RedactedText, `apiKey: "{{GUARD_ALPHA_`) {
		t.Fatalf("redacted code lost quoted string shape:\n%s", byID["syntax_preserving_code"].RedactedText)
	}
}

func TestEvaluateDoesNotLeakKnownSyntheticRawValues(t *testing.T) {
	results, err := Evaluate(manifestPath)
	if err != nil {
		t.Fatalf("Evaluate() error = %v", err)
	}

	blocklist := []string{
		"oskey_test_synthetic_collision",
		"oskey_proj_synthetic",
		"oghp_synthetic",
		"oskey_live_synthetic",
		"synthetic-json-token",
		"synthetic-yaml-token",
		"oskey_test_synthetic_code",
		"synthetic-large-token",
		"qa.user+synthetic@example.invalid",
		"202-555-0142",
		"cus_synthetic_00000000000042",
		"postgres://synthetic_user",
	}

	for _, result := range results {
		for _, raw := range blocklist {
			if strings.Contains(result.RedactedText, raw) {
				t.Fatalf("fixture %q leaked raw value %q:\n%s", result.FixtureID, raw, result.RedactedText)
			}
		}
	}
}

func TestRenderMarkdownOmitsRedactedTextAndRawValues(t *testing.T) {
	results, err := Evaluate(manifestPath)
	if err != nil {
		t.Fatalf("Evaluate() error = %v", err)
	}

	report := RenderMarkdown(Summarize(results), results)
	required := []string{
		"# Guard Alpha Benchmark Report",
		"Fixtures with missing classes",
		"Payload storage violations",
		"Evidence count violations",
		"Hash missing violations",
		"placeholder_collision",
		"identity_and_database_values",
	}
	for _, fragment := range required {
		if !strings.Contains(report, fragment) {
			t.Fatalf("report missing %q:\n%s", fragment, report)
		}
	}

	for _, raw := range []string{
		"oskey_proj_synthetic",
		"synthetic-token",
		"qa.user+synthetic@example.invalid",
		"postgres://synthetic_user",
	} {
		if strings.Contains(report, raw) {
			t.Fatalf("report leaked raw fixture value %q:\n%s", raw, report)
		}
	}
}
