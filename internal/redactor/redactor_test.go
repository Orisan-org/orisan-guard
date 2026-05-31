package redactor

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Orisan-org/orisan-guard/internal/classifier"
	"github.com/Orisan-org/orisan-guard/internal/placeholder"
)

func TestApplyRedactsRawValues(t *testing.T) {
	input := "OPENAI_API_KEY=oskey_proj_synthetic000000000000000000000000000000000000000000000000"
	result := redactFixtureText(t, input)

	if strings.Contains(result.Text, "oskey_proj_synthetic") {
		t.Fatalf("redacted text still contains raw value: %s", result.Text)
	}
	if !strings.Contains(result.Text, "{{GUARD_ALPHA_API_KEY_LIKE_VALUE_") {
		t.Fatalf("redacted text missing placeholder: %s", result.Text)
	}
}

func TestApplyPreservesJSONSyntax(t *testing.T) {
	input := loadFixture(t, "syntax_preserving.json")
	result := redactFixtureText(t, input)

	var parsed map[string]any
	if err := json.Unmarshal([]byte(result.Text), &parsed); err != nil {
		t.Fatalf("redacted JSON is invalid: %v\n%s", err, result.Text)
	}
	if strings.Contains(result.Text, "oskey_test_synthetic_json") ||
		strings.Contains(result.Text, "payments.internal.example.invalid") ||
		strings.Contains(result.Text, "synthetic-json-token") {
		t.Fatalf("redacted JSON still contains raw sensitive values:\n%s", result.Text)
	}
}

func TestApplyPreservesYAMLShape(t *testing.T) {
	input := loadFixture(t, "syntax_preserving.yaml")
	result := redactFixtureText(t, input)

	requiredFragments := []string{
		"service: synthetic-guard-worker",
		"token: {{GUARD_ALPHA_",
		"primary: {{GUARD_ALPHA_",
		"fallback: {{GUARD_ALPHA_",
		"redact_prompts: true",
		"upload_raw_prompts: false",
	}
	for _, fragment := range requiredFragments {
		if !strings.Contains(result.Text, fragment) {
			t.Fatalf("redacted YAML missing %q:\n%s", fragment, result.Text)
		}
	}
}

func TestApplyPreservesCodeStringShape(t *testing.T) {
	input := loadFixture(t, "syntax_preserving.js")
	result := redactFixtureText(t, input)

	requiredFragments := []string{
		`apiKey: "{{GUARD_ALPHA_`,
		`endpoint: "{{GUARD_ALPHA_`,
		"export function getSyntheticConfig()",
	}
	for _, fragment := range requiredFragments {
		if !strings.Contains(result.Text, fragment) {
			t.Fatalf("redacted code missing %q:\n%s", fragment, result.Text)
		}
	}
	if strings.Contains(result.Text, "oskey_test_synthetic_code") ||
		strings.Contains(result.Text, "agent-runtime.internal.example.invalid") {
		t.Fatalf("redacted code still contains raw sensitive values:\n%s", result.Text)
	}
}

func TestApplyRejectsInvalidPlans(t *testing.T) {
	_, err := Apply("abc", []placeholder.PlanItem{{Start: 2, End: 1, Placeholder: "{{GUARD_ALPHA_VALUE}}"}})
	if err == nil {
		t.Fatal("expected invalid span error")
	}

	_, err = Apply("abcdef", []placeholder.PlanItem{
		{Start: 1, End: 4, Placeholder: "{{GUARD_ALPHA_ONE}}"},
		{Start: 3, End: 5, Placeholder: "{{GUARD_ALPHA_TWO}}"},
	})
	if err == nil {
		t.Fatal("expected overlapping span error")
	}
}

func TestApplyDoesNotStoreRawValuesInResultItems(t *testing.T) {
	input := "token=synthetic-token-000000000000"
	result := redactFixtureText(t, input)

	for _, item := range result.Items {
		if strings.Contains(item.Placeholder, "synthetic-token") || strings.Contains(item.ValueHash, "synthetic-token") {
			t.Fatalf("result item contains raw material: %+v", item)
		}
	}
}

func redactFixtureText(t *testing.T, input string) Result {
	t.Helper()
	detections := classifier.Classify(input)
	plan := placeholder.Plan(input, detections)
	result, err := Apply(input, plan)
	if err != nil {
		t.Fatalf("Apply() error = %v", err)
	}
	return result
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
