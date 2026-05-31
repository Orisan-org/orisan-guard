package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/Orisan-org/orisan-guard/internal/harness"
)

func main() {
	manifestPath := flag.String("manifest", "tests/fixtures/guard_alpha/manifest.json", "path to Guard Alpha benchmark manifest")
	jsonPath := flag.String("json", "", "optional path for JSON benchmark output")
	markdownPath := flag.String("markdown", "", "optional path for Markdown benchmark output")
	flag.Parse()

	results, err := harness.Evaluate(*manifestPath)
	if err != nil {
		exitf("evaluate benchmark: %v", err)
	}

	summary := harness.Summarize(results)
	if *jsonPath != "" {
		raw, err := json.MarshalIndent(struct {
			Summary harness.Summary         `json:"summary"`
			Results []harness.FixtureResult `json:"results"`
		}{
			Summary: summary,
			Results: results,
		}, "", "  ")
		if err != nil {
			exitf("marshal JSON: %v", err)
		}
		if err := os.WriteFile(*jsonPath, raw, 0o600); err != nil {
			exitf("write JSON: %v", err)
		}
	}

	report := harness.RenderMarkdown(summary, results)
	if *markdownPath != "" {
		if err := os.WriteFile(*markdownPath, []byte(report), 0o600); err != nil {
			exitf("write Markdown: %v", err)
		}
	}

	fmt.Printf("Guard Alpha benchmark completed: %d fixtures, %d missing-class fixtures, %d payload-storage violations, %d evidence-count violations, %d hash-missing violations\n",
		summary.FixtureCount,
		summary.FixturesWithMissing,
		summary.PayloadStoredViolations,
		summary.EvidenceCountViolations,
		summary.HashMissingViolations,
	)
	if *markdownPath != "" || *jsonPath != "" {
		fmt.Print("Outputs written:")
		if *markdownPath != "" {
			fmt.Printf(" %s", *markdownPath)
		}
		if *jsonPath != "" {
			fmt.Printf(" %s", *jsonPath)
		}
		fmt.Println()
	}
}

func exitf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
