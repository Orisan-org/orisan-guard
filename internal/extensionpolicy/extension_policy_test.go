package extensionpolicy

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

type manifest struct {
	ManifestVersion     int               `json:"manifest_version"`
	Name                string            `json:"name"`
	Permissions         []string          `json:"permissions"`
	HostPermissions     []string          `json:"host_permissions"`
	ContentScripts      []json.RawMessage `json:"content_scripts"`
	ExternallyConnected json.RawMessage   `json:"externally_connectable"`
}

func TestExtensionScaffoldHasNoHostOrRuntimePermissions(t *testing.T) {
	m := loadManifest(t)
	if m.ManifestVersion != 3 {
		t.Fatalf("manifest_version = %d, want 3", m.ManifestVersion)
	}
	if m.Name == "" {
		t.Fatal("extension name is required")
	}
	if len(m.Permissions) != 0 {
		t.Fatalf("permissions = %v, want none", m.Permissions)
	}
	if len(m.HostPermissions) != 0 {
		t.Fatalf("host_permissions = %v, want none", m.HostPermissions)
	}
	if len(m.ContentScripts) != 0 {
		t.Fatalf("content_scripts = %d, want none", len(m.ContentScripts))
	}
	if len(m.ExternallyConnected) != 0 {
		t.Fatalf("externally_connectable is set: %s", string(m.ExternallyConnected))
	}
}

func loadManifest(t *testing.T) manifest {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("../../extension", "manifest.json"))
	if err != nil {
		t.Fatalf("read manifest: %v", err)
	}
	var m manifest
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatalf("parse manifest: %v", err)
	}
	return m
}
