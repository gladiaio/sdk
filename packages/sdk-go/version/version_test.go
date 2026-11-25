package version

import "testing"

func TestSDKVersionIsNonEmpty(t *testing.T) {
	if SDKVersion == "" {
		t.Fatal("SDKVersion must not be empty")
	}
}
