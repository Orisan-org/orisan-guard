package placeholder

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Orisan-org/orisan-guard/internal/classifier"
)

func TestPlanIsDeterministic(t *testing.T) {
	input := "token=synthetic-token-000000000000 email qa.user+synthetic@example.invalid"
	detections := classifier.Classify(input)

	first := Plan(input, detections)
	second := Plan(input, detections)

	if len(first) == 0 {
		t.Fatal("expected placeholder plan items")
	}
	if len(first) != len(second) {
		t.Fatalf("plan lengths differ: %d != %d", len(first), len(second))
	}
	for i := range first {
		if first[i] != second[i] {
			t.Fatalf("plan item %d differs: %+v != %+v", i, first[i], second[i])
		}
	}
}

func TestPlanAvoidsExistingPlaceholderCollisions(t *testing.T) {
	input := loadFixture(t, "placeholder_collision.txt")
	detections := classifier.Classify(input)
	if len(detections) == 0 {
		t.Fatal("expected detections")
	}

	plan := Plan(input, detections)
	for _, item := range plan {
		if strings.Contains(input, item.Placeholder) {
			t.Fatalf("generated placeholder collides with input: %q", item.Placeholder)
		}
	}
}

func TestPlanAvoidsGeneratedPlaceholderCollisions(t *testing.T) {
	detection := classifier.Detection{
		Start:     0,
		End:       12,
		DataClass: "token_like_value",
		ValueHash: "abc123abc1230000",
	}
	detections := []classifier.Detection{detection, detection}

	plan := Plan("", detections)
	if len(plan) != 2 {
		t.Fatalf("plan length = %d, want 2", len(plan))
	}
	if plan[0].Placeholder == plan[1].Placeholder {
		t.Fatalf("generated placeholders collide: %+v", plan)
	}
}

func TestPlanDoesNotStoreRawMatchedValues(t *testing.T) {
	input := "OPENAI_API_KEY=oskey_proj_synthetic000000000000000000000000000000000000000000000000"
	detections := classifier.Classify(input)
	plan := Plan(input, detections)
	if len(plan) == 0 {
		t.Fatal("expected placeholder plan")
	}

	for _, item := range plan {
		if strings.Contains(item.Placeholder, "synthetic") || strings.Contains(item.Placeholder, "sk-proj") {
			t.Fatalf("placeholder includes raw value material: %+v", item)
		}
		if item.ValueHash == "" {
			t.Fatalf("missing value hash: %+v", item)
		}
	}
}

func TestPlanPreservesDetectionSpans(t *testing.T) {
	input := "prefix 🔐 token=synthetic-token-000000000000 suffix"
	detections := classifier.Classify(input)
	plan := Plan(input, detections)
	if len(plan) == 0 {
		t.Fatal("expected placeholder plan")
	}

	for _, item := range plan {
		if item.Start < 0 || item.End <= item.Start || item.End > len(input) {
			t.Fatalf("invalid span: %+v", item)
		}
		if input[item.Start:item.End] == "" {
			t.Fatalf("empty byte slice for item: %+v", item)
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
