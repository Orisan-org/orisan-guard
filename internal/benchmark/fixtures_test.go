package benchmark

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const manifestPath = "../../tests/fixtures/guard_alpha/manifest.json"

func TestGuardAlphaFixtureManifestLoads(t *testing.T) {
	manifest, err := LoadManifest(manifestPath)
	if err != nil {
		t.Fatalf("LoadManifest() error = %v", err)
	}

	if got, want := len(manifest.Fixtures), 11; got != want {
		t.Fatalf("fixture count = %d, want %d", got, want)
	}
}

func TestGuardAlphaFixtureCoverage(t *testing.T) {
	manifest, err := LoadManifest(manifestPath)
	if err != nil {
		t.Fatalf("LoadManifest() error = %v", err)
	}

	requiredTags := []string{
		"placeholder_collision",
		"fake_secrets",
		"synthetic_secrets",
		"internal_urls",
		"hostnames",
		"syntax_preserving",
		"edited_safe_prompt",
		"prompt_injection",
		"evidence_leakage",
		"large_chunking",
		"identity",
		"database_url",
	}

	for _, tag := range requiredTags {
		if !hasTag(manifest, tag) {
			t.Fatalf("missing fixture tag %q", tag)
		}
	}
}

func TestPlaceholderCollisionCasesAreRepresented(t *testing.T) {
	manifest, err := LoadManifest(manifestPath)
	if err != nil {
		t.Fatalf("LoadManifest() error = %v", err)
	}

	var count int
	for _, fixture := range manifest.Fixtures {
		if fixture.Properties.PlaceholderCollision {
			count++
		}
	}

	if count < 2 {
		t.Fatalf("placeholder collision fixture count = %d, want at least 2", count)
	}
}

func TestSyntaxPreservingCasesAreRepresented(t *testing.T) {
	manifest, err := LoadManifest(manifestPath)
	if err != nil {
		t.Fatalf("LoadManifest() error = %v", err)
	}

	wantIDs := map[string]bool{
		"syntax_preserving_json": false,
		"syntax_preserving_yaml": false,
		"syntax_preserving_code": false,
	}

	for _, fixture := range manifest.Fixtures {
		if fixture.Properties.SyntaxPreserving {
			if _, ok := wantIDs[fixture.ID]; ok {
				wantIDs[fixture.ID] = true
			}
		}
	}

	for id, found := range wantIDs {
		if !found {
			t.Fatalf("missing syntax-preserving fixture %q", id)
		}
	}
}

func TestFixtureInputsExistAndAreSynthetic(t *testing.T) {
	manifest, err := LoadManifest(manifestPath)
	if err != nil {
		t.Fatalf("LoadManifest() error = %v", err)
	}

	fixtureRoot := filepath.Dir(manifestPath)
	for _, fixture := range manifest.Fixtures {
		inputPath := filepath.Join(fixtureRoot, fixture.InputPath)
		raw, err := os.ReadFile(inputPath)
		if err != nil {
			t.Fatalf("fixture %q input missing: %v", fixture.ID, err)
		}

		content := strings.ToLower(string(raw))
		if !strings.Contains(content, "synthetic") && fixture.ID != "fake_secret_negative" {
			t.Fatalf("fixture %q should clearly mark values as synthetic", fixture.ID)
		}
		if strings.Contains(content, "upload raw prompts: true") {
			t.Fatalf("fixture %q contains disallowed upload instruction", fixture.ID)
		}
	}
}

func hasTag(manifest Manifest, tag string) bool {
	for _, fixture := range manifest.Fixtures {
		for _, candidate := range fixture.Tags {
			if candidate == tag {
				return true
			}
		}
	}
	return false
}
