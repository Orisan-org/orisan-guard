package engine

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestProcessBuildsLocalRedactionResult(t *testing.T) {
	input := "Email qa.user+synthetic@example.invalid and token=synthetic-token-000000000000."
	result, err := Process(input)
	if err != nil {
		t.Fatalf("Process() error = %v", err)
	}

	if result.PayloadStored {
		t.Fatal("payload_stored = true, want false")
	}
	if len(result.Detections) == 0 {
		t.Fatal("expected detections")
	}
	if len(result.Plan) != len(result.Detections) {
		t.Fatalf("plan length = %d, detections length = %d", len(result.Plan), len(result.Detections))
	}
	if strings.Contains(result.RedactedText, "qa.user+synthetic") || strings.Contains(result.RedactedText, "synthetic-token") {
		t.Fatalf("redacted text leaked raw values: %s", result.RedactedText)
	}
}

func TestProcessPreservesJSONSyntax(t *testing.T) {
	input := loadFixture(t, "syntax_preserving.json")
	result, err := Process(input)
	if err != nil {
		t.Fatalf("Process() error = %v", err)
	}

	if !strings.Contains(result.RedactedText, `"apiKey": "{{GUARD_ALPHA_`) {
		t.Fatalf("redacted JSON missing apiKey placeholder:\n%s", result.RedactedText)
	}
	if strings.Contains(result.RedactedText, "oskey_test_synthetic_json") {
		t.Fatalf("redacted JSON leaked API key:\n%s", result.RedactedText)
	}
}

func TestProcessDoesNotExposeRawValuesInMetadata(t *testing.T) {
	rawValue := "oskey_proj_synthetic000000000000000000000000000000000000000000000000"
	result, err := Process("OPENAI_API_KEY=" + rawValue)
	if err != nil {
		t.Fatalf("Process() error = %v", err)
	}

	for _, detection := range result.Detections {
		if strings.Contains(detection.ValueHash, rawValue) {
			t.Fatalf("detection hash leaked raw value: %+v", detection)
		}
	}
	for _, item := range result.Plan {
		if strings.Contains(item.Placeholder, "synthetic") || strings.Contains(item.ValueHash, rawValue) {
			t.Fatalf("plan item leaked raw value: %+v", item)
		}
	}
}

func TestProcessIsDeterministic(t *testing.T) {
	input := loadFixture(t, "identity_and_database_values.txt")
	first, err := Process(input)
	if err != nil {
		t.Fatalf("first Process() error = %v", err)
	}
	second, err := Process(input)
	if err != nil {
		t.Fatalf("second Process() error = %v", err)
	}

	if first.RedactedText != second.RedactedText {
		t.Fatal("redacted text is not deterministic")
	}
	if len(first.Plan) != len(second.Plan) {
		t.Fatalf("plan lengths differ: %d != %d", len(first.Plan), len(second.Plan))
	}
	for i := range first.Plan {
		if first.Plan[i] != second.Plan[i] {
			t.Fatalf("plan item %d differs: %+v != %+v", i, first.Plan[i], second.Plan[i])
		}
	}
}

func loadFixture(t *testing.T, name string) string {
	t.Helper()
	path := filepath.Join("../../tests/fixtures/guard_alpha/inputs", name)
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read fixture %s: %v", name, err)
	}
	return string(raw)
}
