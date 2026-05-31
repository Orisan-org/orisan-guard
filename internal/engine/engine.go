package engine

import (
	"github.com/Orisan-org/orisan-guard/internal/classifier"
	"github.com/Orisan-org/orisan-guard/internal/placeholder"
	"github.com/Orisan-org/orisan-guard/internal/redactor"
)

type Result struct {
	RedactedText  string                 `json:"redacted_text"`
	Detections    []classifier.Detection `json:"detections"`
	Plan          []placeholder.PlanItem `json:"plan"`
	PayloadStored bool                   `json:"payload_stored"`
}

func Process(input string) (Result, error) {
	detections := classifier.Classify(input)
	plan := placeholder.Plan(input, detections)
	redacted, err := redactor.Apply(input, plan)
	if err != nil {
		return Result{}, err
	}

	return Result{
		RedactedText:  redacted.Text,
		Detections:    append([]classifier.Detection(nil), detections...),
		Plan:          append([]placeholder.PlanItem(nil), plan...),
		PayloadStored: false,
	}, nil
}
