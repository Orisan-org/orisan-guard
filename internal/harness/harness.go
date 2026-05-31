package harness

import (
	"os"
	"path/filepath"
	"sort"

	"github.com/Orisan-org/orisan-guard/internal/benchmark"
	"github.com/Orisan-org/orisan-guard/internal/engine"
)

type FixtureResult struct {
	FixtureID       string   `json:"fixture_id"`
	ExpectedClasses []string `json:"expected_classes"`
	DetectedClasses []string `json:"detected_classes"`
	MissingClasses  []string `json:"missing_classes"`
	PayloadStored   bool     `json:"payload_stored"`
	InputSHA256     string   `json:"input_sha256"`
	RedactedSHA256  string   `json:"redacted_sha256"`
	DetectionCount  int      `json:"detection_count"`
	EvidenceCount   int      `json:"evidence_count"`
	RedactedText    string   `json:"redacted_text"`
}

type Summary struct {
	FixtureCount            int      `json:"fixture_count"`
	FixturesWithMissing     int      `json:"fixtures_with_missing"`
	PayloadStoredViolations int      `json:"payload_stored_violations"`
	EvidenceCountViolations int      `json:"evidence_count_violations"`
	HashMissingViolations   int      `json:"hash_missing_violations"`
	DetectedClasses         []string `json:"detected_classes"`
}

func Evaluate(manifestPath string) ([]FixtureResult, error) {
	manifest, err := benchmark.LoadManifest(manifestPath)
	if err != nil {
		return nil, err
	}

	root := filepath.Dir(manifestPath)
	results := make([]FixtureResult, 0, len(manifest.Fixtures))
	for _, fixture := range manifest.Fixtures {
		raw, err := os.ReadFile(filepath.Join(root, fixture.InputPath))
		if err != nil {
			return nil, err
		}

		result, err := engine.Process(string(raw))
		if err != nil {
			return nil, err
		}

		detectedClasses := uniqueDetectedClasses(result)
		results = append(results, FixtureResult{
			FixtureID:       fixture.ID,
			ExpectedClasses: append([]string(nil), fixture.Expected.DataClasses...),
			DetectedClasses: detectedClasses,
			MissingClasses:  missingClasses(fixture.Expected.DataClasses, detectedClasses),
			PayloadStored:   result.PayloadStored,
			InputSHA256:     result.InputSHA256,
			RedactedSHA256:  result.RedactedSHA256,
			DetectionCount:  result.DetectionCount,
			EvidenceCount:   len(result.Evidence),
			RedactedText:    result.RedactedText,
		})
	}

	return results, nil
}

func Summarize(results []FixtureResult) Summary {
	detected := map[string]struct{}{}
	summary := Summary{
		FixtureCount: len(results),
	}

	for _, result := range results {
		if len(result.MissingClasses) > 0 {
			summary.FixturesWithMissing++
		}
		if result.PayloadStored {
			summary.PayloadStoredViolations++
		}
		if result.EvidenceCount != result.DetectionCount {
			summary.EvidenceCountViolations++
		}
		if result.InputSHA256 == "" || result.RedactedSHA256 == "" {
			summary.HashMissingViolations++
		}
		for _, class := range result.DetectedClasses {
			detected[class] = struct{}{}
		}
	}

	summary.DetectedClasses = make([]string, 0, len(detected))
	for class := range detected {
		summary.DetectedClasses = append(summary.DetectedClasses, class)
	}
	sort.Strings(summary.DetectedClasses)
	return summary
}

func uniqueDetectedClasses(result engine.Result) []string {
	seen := map[string]struct{}{}
	for _, detection := range result.Detections {
		seen[detection.DataClass] = struct{}{}
	}

	classes := make([]string, 0, len(seen))
	for class := range seen {
		classes = append(classes, class)
	}
	sort.Strings(classes)
	return classes
}

func missingClasses(expected, detected []string) []string {
	seen := map[string]struct{}{}
	for _, class := range detected {
		seen[class] = struct{}{}
	}

	var missing []string
	for _, class := range expected {
		if _, ok := seen[class]; !ok {
			missing = append(missing, class)
		}
	}
	return missing
}
