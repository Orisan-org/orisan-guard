package harness

import (
	"fmt"
	"strings"
)

func RenderMarkdown(summary Summary, results []FixtureResult) string {
	var b strings.Builder
	b.WriteString("# Guard Alpha Benchmark Report\n\n")
	b.WriteString("## Summary\n\n")
	fmt.Fprintf(&b, "- Fixtures: `%d`\n", summary.FixtureCount)
	fmt.Fprintf(&b, "- Fixtures with missing classes: `%d`\n", summary.FixturesWithMissing)
	fmt.Fprintf(&b, "- Payload storage violations: `%d`\n", summary.PayloadStoredViolations)
	b.WriteString("- Detected classes: ")
	if len(summary.DetectedClasses) == 0 {
		b.WriteString("`none`\n")
	} else {
		b.WriteString("`")
		b.WriteString(strings.Join(summary.DetectedClasses, "`, `"))
		b.WriteString("`\n")
	}

	b.WriteString("\n## Fixtures\n\n")
	for _, result := range results {
		fmt.Fprintf(&b, "### %s\n\n", result.FixtureID)
		b.WriteString("- Expected classes: ")
		writeInlineList(&b, result.ExpectedClasses)
		b.WriteByte('\n')
		b.WriteString("- Detected classes: ")
		writeInlineList(&b, result.DetectedClasses)
		b.WriteByte('\n')
		b.WriteString("- Missing classes: ")
		writeInlineList(&b, result.MissingClasses)
		b.WriteByte('\n')
		fmt.Fprintf(&b, "- Payload stored: `%t`\n\n", result.PayloadStored)
	}

	return b.String()
}

func writeInlineList(b *strings.Builder, values []string) {
	if len(values) == 0 {
		b.WriteString("`none`")
		return
	}
	b.WriteString("`")
	b.WriteString(strings.Join(values, "`, `"))
	b.WriteString("`")
}
