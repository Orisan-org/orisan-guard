package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestRedactCommandWritesRedactedTextAndEvidence(t *testing.T) {
	temp := t.TempDir()
	inputPath := filepath.Join(temp, "input.txt")
	outputPath := filepath.Join(temp, "redacted.txt")
	jsonPath := filepath.Join(temp, "evidence.json")

	raw := "OPENAI_API_KEY=oskey_proj_synthetic000000000000000000000000000000000000000000000000"
	if err := os.WriteFile(inputPath, []byte(raw), 0o600); err != nil {
		t.Fatalf("write input: %v", err)
	}

	cmd := exec.Command("go", "run", ".", "--input", inputPath, "--output", outputPath, "--json", jsonPath)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("command failed: %v\n%s", err, string(out))
	}

	redacted, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("read redacted output: %v", err)
	}
	if strings.Contains(string(redacted), "oskey_proj_synthetic") {
		t.Fatalf("redacted output leaked raw value:\n%s", string(redacted))
	}
	if !strings.Contains(string(redacted), "{{GUARD_ALPHA_API_KEY_LIKE_VALUE_") {
		t.Fatalf("redacted output missing placeholder:\n%s", string(redacted))
	}

	evidence, err := os.ReadFile(jsonPath)
	if err != nil {
		t.Fatalf("read evidence JSON: %v", err)
	}
	if strings.Contains(string(evidence), raw) || strings.Contains(string(evidence), "oskey_proj_synthetic") {
		t.Fatalf("evidence JSON leaked raw value:\n%s", string(evidence))
	}
	for _, fragment := range []string{`"payload_stored": false`, `"input_sha256"`, `"redacted_sha256"`, `"evidence"`} {
		if !strings.Contains(string(evidence), fragment) {
			t.Fatalf("evidence JSON missing %q:\n%s", fragment, string(evidence))
		}
	}
}

func TestRedactCommandReadsStdin(t *testing.T) {
	cmd := exec.Command("go", "run", ".")
	cmd.Stdin = strings.NewReader("token=synthetic-token-000000000000")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("command failed: %v\n%s", err, string(out))
	}
	if strings.Contains(string(out), "synthetic-token") {
		t.Fatalf("stdout leaked raw token: %s", string(out))
	}
	if !strings.Contains(string(out), "{{GUARD_ALPHA_TOKEN_LIKE_VALUE_") {
		t.Fatalf("stdout missing placeholder: %s", string(out))
	}
}
