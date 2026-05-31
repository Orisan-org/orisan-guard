package classifier

import (
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"testing"

	"github.com/Orisan-org/orisan-guard/internal/benchmark"
)

const benchmarkManifest = "../../tests/fixtures/guard_alpha/manifest.json"

func TestClassifierDetectsExpectedBenchmarkClasses(t *testing.T) {
	manifest, err := benchmark.LoadManifest(benchmarkManifest)
	if err != nil {
		t.Fatalf("LoadManifest() error = %v", err)
	}

	fixtureRoot := filepath.Dir(benchmarkManifest)
	for _, fixture := range manifest.Fixtures {
		raw, err := os.ReadFile(filepath.Join(fixtureRoot, fixture.InputPath))
		if err != nil {
			t.Fatalf("read fixture %q: %v", fixture.ID, err)
		}

		detections := Classify(string(raw))
		seen := map[string]bool{}
		for _, detection := range detections {
			seen[detection.DataClass] = true
		}

		for _, expectedClass := range fixture.Expected.DataClasses {
			if !seen[expectedClass] {
				t.Fatalf("fixture %q missing expected class %q; detections=%v", fixture.ID, expectedClass, classes(detections))
			}
		}
	}
}

func TestClassifierDetectionMetadataIsPopulated(t *testing.T) {
	input := "Email qa.user+synthetic@example.invalid and token=synthetic-token-000000."
	detections := Classify(input)
	if len(detections) == 0 {
		t.Fatal("expected detections")
	}

	for _, detection := range detections {
		if detection.Start < 0 || detection.End <= detection.Start || detection.End > len(input) {
			t.Fatalf("invalid offsets: %+v for input length %d", detection, len(input))
		}
		if detection.DataClass == "" {
			t.Fatalf("missing data class: %+v", detection)
		}
		if detection.Confidence == "" {
			t.Fatalf("missing confidence: %+v", detection)
		}
		if detection.Reason == "" {
			t.Fatalf("missing reason: %+v", detection)
		}
		if detection.ReplacementStrategy == "" {
			t.Fatalf("missing replacement strategy: %+v", detection)
		}
		if detection.EvidenceSafetyLevel == "" {
			t.Fatalf("missing evidence safety level: %+v", detection)
		}
		if detection.ValueHash == "" {
			t.Fatalf("missing value hash: %+v", detection)
		}
	}
}

func TestFakeSecretsAreLowerConfidenceThanRealLookingSyntheticSecrets(t *testing.T) {
	fake := Classify("token=not-a-real-token API_KEY=example aws_secret_access_key=FAKEFAKEFAKEFAKEFAKE")
	realLooking := Classify("OPENAI_API_KEY=oskey_proj_synthetic000000000000000000000000000000000000000000000000")

	if minConfidence(fake, "token_like_value") != "low" {
		t.Fatalf("fake token confidence = %q, want low; detections=%+v", minConfidence(fake, "token_like_value"), fake)
	}
	if maxConfidence(realLooking, "api_key_like_value") != "high" {
		t.Fatalf("real-looking API key confidence = %q, want high; detections=%+v", maxConfidence(realLooking, "api_key_like_value"), realLooking)
	}
}

func TestClassifierDoesNotStoreRawMatchedValues(t *testing.T) {
	secret := "oskey_proj_synthetic000000000000000000000000000000000000000000000000"
	detections := Classify(secret)
	if len(detections) == 0 {
		t.Fatal("expected detection")
	}

	for _, detection := range detections {
		if detection.ValueHash == secret {
			t.Fatalf("value hash stored raw value: %+v", detection)
		}
	}
}

func TestOffsetsAreByteOffsetsAndSafeForGoSlicing(t *testing.T) {
	input := "prefix 🔐 token=synthetic-token-000000000000 suffix"
	detections := Classify(input)
	if len(detections) == 0 {
		t.Fatal("expected detection")
	}

	var token Detection
	for _, detection := range detections {
		if detection.DataClass == "token_like_value" {
			token = detection
			break
		}
	}
	if token.DataClass == "" {
		t.Fatalf("missing token detection: %+v", detections)
	}

	if token.Start == len([]rune(input[:token.Start])) {
		t.Fatalf("test did not prove byte/rune offset difference; start=%d", token.Start)
	}
	if got := input[token.Start:token.End]; got != "synthetic-token-000000000000" {
		t.Fatalf("byte span slice = %q", got)
	}
}

func TestPublicURLIsNotInternalURL(t *testing.T) {
	input := "See https://example.com/docs and https://api.github.com/repos."
	for _, detection := range Classify(input) {
		if detection.DataClass == "internal_url" {
			t.Fatalf("public URL classified as internal_url: %+v", detection)
		}
	}
}

func TestInternalURLRequiresInternalIndicator(t *testing.T) {
	input := "Use https://svc.internal.example.invalid/run and http://localhost:8080/status."
	if countClass(Classify(input), "internal_url") != 2 {
		t.Fatalf("expected two internal URL detections, got %+v", Classify(input))
	}
}

func TestOverlapResolutionSuppressesNestedDatabaseChildren(t *testing.T) {
	input := "DATABASE_URL=postgres://synthetic_user:synthetic_pass@db.internal.example.invalid:5432/synthetic_app"
	detections := Classify(input)
	if countClass(detections, "database_url") != 1 {
		t.Fatalf("expected one database_url detection, got %+v", detections)
	}
	if countClass(detections, "internal_hostname") != 0 {
		t.Fatalf("expected database_url to suppress nested hostname, got %+v", detections)
	}
}

func TestOverlapResolutionSuppressesNestedURLHostname(t *testing.T) {
	input := "URL=https://payments-api.internal.example.invalid/v1/charge"
	detections := Classify(input)
	if countClass(detections, "internal_url") != 1 {
		t.Fatalf("expected one internal_url detection, got %+v", detections)
	}
	if countClass(detections, "internal_hostname") != 0 {
		t.Fatalf("expected internal_url to suppress nested hostname, got %+v", detections)
	}
}

func TestNormalAssignmentsDoNotMatchTokenLikeValue(t *testing.T) {
	input := "name=orisan retries=3 mode=local color=green"
	if countClass(Classify(input), "token_like_value") != 0 {
		t.Fatalf("normal assignment classified as token-like: %+v", Classify(input))
	}
}

func TestTokenAssignmentSpanTargetsValueOnly(t *testing.T) {
	input := "token: synthetic-yaml-token-000000000000000000"
	detections := Classify(input)
	if got, want := countClass(detections, "token_like_value"), 1; got != want {
		t.Fatalf("token_like_value count = %d, want %d; detections=%+v", got, want, detections)
	}

	for _, detection := range detections {
		if detection.DataClass != "token_like_value" {
			continue
		}
		if got := input[detection.Start:detection.End]; got != "synthetic-yaml-token-000000000000000000" {
			t.Fatalf("token span = %q", got)
		}
	}
}

func TestIPPrecision(t *testing.T) {
	input := "private 10.42.7.19 loopback 127.0.0.1 linklocal 169.254.10.20 public 8.8.8.8 invalid 999.999.999.999"
	detections := Classify(input)
	if got, want := countClass(detections, "ip_address"), 3; got != want {
		t.Fatalf("ip_address count = %d, want %d; detections=%+v", got, want, detections)
	}
	for _, detection := range detections {
		if detection.DataClass != "ip_address" {
			continue
		}
		value := input[detection.Start:detection.End]
		if value == "8.8.8.8" || value == "999.999.999.999" {
			t.Fatalf("unexpected IP detection for %q: %+v", value, detection)
		}
	}
}

func TestClassifierDoesNotImportNetworkPackages(t *testing.T) {
	files := []string{"classifier.go"}
	disallowed := map[string]bool{
		"net":      true,
		"net/http": true,
	}

	for _, file := range files {
		parsed, err := parser.ParseFile(token.NewFileSet(), file, nil, parser.ImportsOnly)
		if err != nil {
			t.Fatalf("parse imports for %s: %v", file, err)
		}
		for _, imported := range parsed.Imports {
			path := imported.Path.Value
			path = path[1 : len(path)-1]
			if disallowed[path] {
				t.Fatalf("classifier imports network package %q", path)
			}
		}
	}
}

func classes(detections []Detection) []string {
	result := make([]string, 0, len(detections))
	for _, detection := range detections {
		result = append(result, detection.DataClass)
	}
	return result
}

func countClass(detections []Detection, dataClass string) int {
	var count int
	for _, detection := range detections {
		if detection.DataClass == dataClass {
			count++
		}
	}
	return count
}

func minConfidence(detections []Detection, dataClass string) string {
	best := ""
	for _, detection := range detections {
		if detection.DataClass != dataClass {
			continue
		}
		if best == "" || confidenceRank(detection.Confidence) < confidenceRank(best) {
			best = detection.Confidence
		}
	}
	return best
}

func maxConfidence(detections []Detection, dataClass string) string {
	best := ""
	for _, detection := range detections {
		if detection.DataClass != dataClass {
			continue
		}
		if best == "" || confidenceRank(detection.Confidence) > confidenceRank(best) {
			best = detection.Confidence
		}
	}
	return best
}

func confidenceRank(confidence string) int {
	switch confidence {
	case "info":
		return 1
	case "low":
		return 2
	case "medium":
		return 3
	case "high":
		return 4
	default:
		return 0
	}
}
