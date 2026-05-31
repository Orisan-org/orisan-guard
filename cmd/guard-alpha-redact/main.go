package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"

	"github.com/Orisan-org/orisan-guard/internal/engine"
)

func main() {
	inputPath := flag.String("input", "", "input text file to redact; reads stdin when omitted")
	outputPath := flag.String("output", "", "optional path for redacted text output; writes stdout when omitted")
	jsonPath := flag.String("json", "", "optional path for JSON evidence output")
	jsonEvidenceOnly := flag.Bool("json-evidence-only", false, "omit redacted_text from JSON evidence output")
	flag.Parse()

	input, err := readInput(*inputPath)
	if err != nil {
		exitf("read input: %v", err)
	}

	result, err := engine.Process(string(input))
	if err != nil {
		exitf("process input: %v", err)
	}

	if *outputPath != "" {
		if err := os.WriteFile(*outputPath, []byte(result.RedactedText), 0o600); err != nil {
			exitf("write redacted output: %v", err)
		}
	} else {
		fmt.Print(result.RedactedText)
	}

	if *jsonPath != "" {
		jsonOutput := any(result)
		if *jsonEvidenceOnly {
			jsonOutput = evidenceOnlyResult{
				Detections:     result.Detections,
				Plan:           result.Plan,
				Evidence:       result.Evidence,
				InputSHA256:    result.InputSHA256,
				RedactedSHA256: result.RedactedSHA256,
				DetectionCount: result.DetectionCount,
				PlanCount:      result.PlanCount,
				PayloadStored:  result.PayloadStored,
			}
		}
		raw, err := json.MarshalIndent(jsonOutput, "", "  ")
		if err != nil {
			exitf("marshal JSON: %v", err)
		}
		if err := os.WriteFile(*jsonPath, raw, 0o600); err != nil {
			exitf("write JSON: %v", err)
		}
	}

	if *outputPath != "" || *jsonPath != "" {
		fmt.Fprintf(os.Stderr, "Guard Alpha redact completed: %d detections, payload_stored=%t\n", result.DetectionCount, result.PayloadStored)
	}
}

type evidenceOnlyResult struct {
	Detections     any    `json:"detections"`
	Plan           any    `json:"plan"`
	Evidence       any    `json:"evidence"`
	InputSHA256    string `json:"input_sha256"`
	RedactedSHA256 string `json:"redacted_sha256"`
	DetectionCount int    `json:"detection_count"`
	PlanCount      int    `json:"plan_count"`
	PayloadStored  bool   `json:"payload_stored"`
}

func readInput(path string) ([]byte, error) {
	if path == "" {
		return io.ReadAll(os.Stdin)
	}
	return os.ReadFile(path)
}

func exitf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
