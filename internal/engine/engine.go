package engine

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/Orisan-org/orisan-guard/internal/classifier"
	"github.com/Orisan-org/orisan-guard/internal/placeholder"
	"github.com/Orisan-org/orisan-guard/internal/redactor"
)

type Result struct {
	RedactedText   string                 `json:"redacted_text"`
	Detections     []classifier.Detection `json:"detections"`
	Plan           []placeholder.PlanItem `json:"plan"`
	Evidence       []EvidenceItem         `json:"evidence"`
	InputSHA256    string                 `json:"input_sha256"`
	RedactedSHA256 string                 `json:"redacted_sha256"`
	DetectionCount int                    `json:"detection_count"`
	PlanCount      int                    `json:"plan_count"`
	PayloadStored  bool                   `json:"payload_stored"`
}

type EvidenceItem struct {
	DataClass           string `json:"data_class"`
	Confidence          string `json:"confidence"`
	Reason              string `json:"reason"`
	ReplacementStrategy string `json:"replacement_strategy"`
	EvidenceSafetyLevel string `json:"evidence_safety_level"`
	ValueHash           string `json:"value_hash"`
	Placeholder         string `json:"placeholder"`
	Start               int    `json:"start"`
	End                 int    `json:"end"`
}

func Process(input string) (Result, error) {
	detections := classifier.Classify(input)
	plan := placeholder.Plan(input, detections)
	redacted, err := redactor.Apply(input, plan)
	if err != nil {
		return Result{}, err
	}

	return Result{
		RedactedText:   redacted.Text,
		Detections:     append([]classifier.Detection(nil), detections...),
		Plan:           append([]placeholder.PlanItem(nil), plan...),
		Evidence:       buildEvidence(detections, plan),
		InputSHA256:    hashText(input),
		RedactedSHA256: hashText(redacted.Text),
		DetectionCount: len(detections),
		PlanCount:      len(plan),
		PayloadStored:  false,
	}, nil
}

func buildEvidence(detections []classifier.Detection, plan []placeholder.PlanItem) []EvidenceItem {
	evidence := make([]EvidenceItem, 0, len(detections))
	for i, detection := range detections {
		item := EvidenceItem{
			DataClass:           detection.DataClass,
			Confidence:          detection.Confidence,
			Reason:              detection.Reason,
			ReplacementStrategy: detection.ReplacementStrategy,
			EvidenceSafetyLevel: detection.EvidenceSafetyLevel,
			ValueHash:           detection.ValueHash,
			Start:               detection.Start,
			End:                 detection.End,
		}
		if i < len(plan) {
			item.Placeholder = plan[i].Placeholder
		}
		evidence = append(evidence, item)
	}
	return evidence
}

func hashText(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
