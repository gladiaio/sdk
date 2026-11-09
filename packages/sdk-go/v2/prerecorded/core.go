package prerecorded

import (
	"net/url"
	"os"
	"path/filepath"

	"github.com/gladiaio/sdk-go/v2"
)

// Core holds pre-recorded-specific helpers (Python: PreRecordedV2Core).
type Core struct {
	v2.JobCore
}

// NewCore constructs shared job helpers for /v2/pre-recorded.
func NewCore() Core {
	return Core{JobCore: v2.JobCore{BasePath: "/v2/pre-recorded", Kind: "Pre-recorded"}}
}

// IsURL reports whether s is an http(s) URL.
func IsURL(s string) bool {
	u, err := url.Parse(s)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

// FilenameForPath returns the base name for a local path upload.
func FilenameForPath(path string) string {
	return filepath.Base(path)
}

// FilenameForReader returns a filename for an io.Reader upload.
func FilenameForReader(name string) string {
	if name == "" {
		return "audio"
	}
	return filepath.Base(name)
}

// ContentTypeForUpload is the default upload MIME type.
func ContentTypeForUpload() string {
	return "application/octet-stream"
}

// FileExists returns whether path exists on disk (used before upload).
func FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
