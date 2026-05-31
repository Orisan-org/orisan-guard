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
	if len(result.Evidence) != len(result.Detections) {
		t.Fatalf("evidence length = %d, detections length = %d", len(result.Evidence), len(result.Detections))
	}
	if result.DetectionCount != len(result.Detections) {
		t.Fatalf("detection_count = %d, detections length = %d", result.DetectionCount, len(result.Detections))
	}
	if result.PlanCount != len(result.Plan) {
		t.Fatalf("plan_count = %d, plan length = %d", result.PlanCount, len(result.Plan))
	}
	if result.InputSHA256 == "" || result.RedactedSHA256 == "" {
		t.Fatalf("missing deterministic hashes: %+v", result)
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
	for _, item := range result.Evidence {
		serialized := item.DataClass + item.Confidence + item.Reason + item.ReplacementStrategy + item.EvidenceSafetyLevel + item.ValueHash + item.Placeholder
		if strings.Contains(serialized, rawValue) || strings.Contains(serialized, "oskey_proj_synthetic") {
			t.Fatalf("evidence item leaked raw value: %+v", item)
		}
		if item.ValueHash == "" || item.Placeholder == "" {
			t.Fatalf("evidence item missing safe reference fields: %+v", item)
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
	if first.InputSHA256 != second.InputSHA256 {
		t.Fatalf("input hashes differ: %q != %q", first.InputSHA256, second.InputSHA256)
	}
	if first.RedactedSHA256 != second.RedactedSHA256 {
		t.Fatalf("redacted hashes differ: %q != %q", first.RedactedSHA256, second.RedactedSHA256)
	}
	if len(first.Plan) != len(second.Plan) {
		t.Fatalf("plan lengths differ: %d != %d", len(first.Plan), len(second.Plan))
	}
	for i := range first.Plan {
		if first.Plan[i] != second.Plan[i] {
			t.Fatalf("plan item %d differs: %+v != %+v", i, first.Plan[i], second.Plan[i])
		}
	}
	for i := range first.Evidence {
		if first.Evidence[i] != second.Evidence[i] {
			t.Fatalf("evidence item %d differs: %+v != %+v", i, first.Evidence[i], second.Evidence[i])
		}
	}
}

func TestProcessHashesRepresentInputAndRedactedText(t *testing.T) {
	first, err := Process("token=synthetic-token-000000000000")
	if err != nil {
		t.Fatalf("first Process() error = %v", err)
	}
	second, err := Process("token=synthetic-token-111111111111")
	if err != nil {
		t.Fatalf("second Process() error = %v", err)
	}

	if first.InputSHA256 == second.InputSHA256 {
		t.Fatal("different inputs produced the same input hash")
	}
	if first.InputSHA256 == first.RedactedSHA256 {
		t.Fatal("input hash and redacted hash should differ when redaction changes text")
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
