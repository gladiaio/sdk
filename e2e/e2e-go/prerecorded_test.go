package e2e_test

import (
	"context"
	"strings"
	"testing"

	"github.com/gladiaio/sdk-go"
	"github.com/gladiaio/sdk-go/clientoptions"
)

func TestPreRecordedUploadFileRejectsURL(t *testing.T) {
	// No Gladia API call — validation only; does not require GLADIA_API_KEY.
	client, err := gladia.NewGladiaClient(&clientoptions.GladiaClientOptions{
		APIURL: "https://proxy.example.invalid",
	})
	if err != nil {
		t.Fatal(err)
	}
	pre, err := client.PreRecordedV2(nil)
	if err != nil {
		t.Fatal(err)
	}
	_, err = pre.UploadFile(context.Background(), youtubeURL)
	if err == nil {
		t.Fatal("expected error for URL upload")
	}
	if !strings.Contains(err.Error(), "URL") && !strings.Contains(err.Error(), "local") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestPreRecordedUploadAndPoll(t *testing.T) {
	client := newE2EClient(t)
	pre, err := client.PreRecordedV2(nil)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), pollTimeout)
	defer cancel()

	upload, err := pre.UploadFile(ctx, dataPath(shortAudioFile))
	if err != nil {
		t.Fatalf("upload: %v", err)
	}
	if upload.AudioUrl == "" {
		t.Fatal("expected audio_url")
	}
	if upload.AudioMetadata.AudioDuration < 0 {
		t.Fatal("expected audio duration metadata")
	}

	init, err := pre.Create(ctx, prerecordedOptions(upload.AudioUrl))
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if init.Id == "" || init.ResultUrl == "" {
		t.Fatal("expected id and result_url")
	}

	result, err := pre.Poll(ctx, init.Id, pollInterval)
	if err != nil {
		t.Fatalf("poll: %v", err)
	}
	if result.Status != "done" {
		t.Fatalf("expected status done, got %q", result.Status)
	}
	if result.Id != init.Id {
		t.Fatalf("job id mismatch")
	}
}
