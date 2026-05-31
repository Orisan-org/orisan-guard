package benchmark

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
)

type Manifest struct {
	SchemaVersion string    `json:"schema_version"`
	Description   string    `json:"description"`
	Fixtures      []Fixture `json:"fixtures"`
}

type Fixture struct {
	ID          string     `json:"id"`
	InputPath   string     `json:"input_path"`
	Description string     `json:"description"`
	Tags        []string   `json:"tags"`
	Expected    Expected   `json:"expected"`
	Properties  Properties `json:"properties"`
}

type Expected struct {
	DataClasses         []string `json:"data_classes"`
	Confidence          string   `json:"confidence"`
	ReplacementStrategy string   `json:"replacement_strategy"`
	EvidenceSafePreview string   `json:"evidence_safe_preview"`
}

type Properties struct {
	PlaceholderCollision bool `json:"placeholder_collision"`
	SyntaxPreserving     bool `json:"syntax_preserving"`
	LargeChunking        bool `json:"large_chunking"`
	EditedSafeRescan     bool `json:"edited_safe_rescan"`
}

func LoadManifest(path string) (Manifest, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return Manifest{}, err
	}

	var manifest Manifest
	if err := json.Unmarshal(raw, &manifest); err != nil {
		return Manifest{}, err
	}
	if err := manifest.Validate(); err != nil {
		return Manifest{}, err
	}

	return manifest, nil
}

func (m Manifest) Validate() error {
	if m.SchemaVersion == "" {
		return errors.New("schema_version is required")
	}
	if len(m.Fixtures) == 0 {
		return errors.New("at least one fixture is required")
	}

	seen := map[string]struct{}{}
	for _, fixture := range m.Fixtures {
		if err := fixture.Validate(); err != nil {
			return fmt.Errorf("fixture %q: %w", fixture.ID, err)
		}
		if _, ok := seen[fixture.ID]; ok {
			return fmt.Errorf("duplicate fixture id %q", fixture.ID)
		}
		seen[fixture.ID] = struct{}{}
	}

	return nil
}

func (f Fixture) Validate() error {
	if f.ID == "" {
		return errors.New("id is required")
	}
	if f.InputPath == "" {
		return errors.New("input_path is required")
	}
	if f.Description == "" {
		return errors.New("description is required")
	}
	if len(f.Tags) == 0 {
		return errors.New("at least one tag is required")
	}
	if len(f.Expected.DataClasses) == 0 {
		return errors.New("expected.data_classes is required")
	}
	if f.Expected.Confidence == "" {
		return errors.New("expected.confidence is required")
	}
	if f.Expected.ReplacementStrategy == "" {
		return errors.New("expected.replacement_strategy is required")
	}
	if f.Expected.EvidenceSafePreview == "" {
		return errors.New("expected.evidence_safe_preview is required")
	}

	return nil
}
