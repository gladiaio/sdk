package e2e_test

import (
	"context"
	"strings"
	"testing"
)

func TestPreRecordedUploadFile(t *testing.T) {
	pre := prerecordedClient(t)
	upload := uploadShortAudio(t, pre)
	if upload.AudioMetadata.AudioDuration < 0 {
		t.Fatal("expected audio duration metadata")
	}
}

func TestPreRecordedUploadFileRejectsURL(t *testing.T) {
	pre := prerecordedClient(t)
	_, err := pre.UploadFile(context.Background(), youtubeURL)
	if err == nil {
		t.Fatal("expected error for URL upload")
	}
	msg := err.Error()
	if !strings.Contains(msg, "URL") && !strings.Contains(msg, "local") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestPreRecordedCreate(t *testing.T) {
	pre := prerecordedClient(t)
	upload := uploadShortAudio(t, pre)
	ctx := context.Background()
	init, err := pre.Create(ctx, prerecordedCreateBody(upload.AudioUrl))
	if err != nil {
		t.Fatal(err)
	}
	if init.Id == "" || init.ResultUrl == "" {
		t.Fatal("expected id and result_url")
	}
}

func TestPreRecordedPoll(t *testing.T) {
	pre := prerecordedClient(t)
	init, result := createAndPollShort(t, pre)
	if result.Status != "done" || result.Id != init.Id {
		t.Fatalf("poll: got status=%q id=%q", result.Status, result.Id)
	}
}

func TestPreRecordedGet(t *testing.T) {
	pre := prerecordedClient(t)
	init, _ := createAndPollShort(t, pre)
	got, err := pre.Get(context.Background(), init.Id)
	if err != nil {
		t.Fatal(err)
	}
	if got.Status != "done" || got.Result == nil {
		t.Fatalf("get: status=%q result=%v", got.Status, got.Result)
	}
}

func TestPreRecordedList(t *testing.T) {
	pre := prerecordedClient(t)
	init, _ := createAndPollShort(t, pre)
	findPreRecordedJobInList(t, pre, init.Id)
}

func TestPreRecordedDelete(t *testing.T) {
	pre := prerecordedClient(t)
	init, _ := createAndPollShort(t, pre)
	ok, err := pre.Delete(context.Background(), init.Id)
	if err != nil {
		t.Fatal(err)
	}
	if !ok {
		t.Fatal("expected delete to return true")
	}
}

func TestPreRecordedDeleteNonexistent(t *testing.T) {
	pre := prerecordedClient(t)
	_, err := pre.Delete(context.Background(), nonexistentJobID)
	if err == nil {
		t.Fatal("expected error")
	}
	status, ok := httpErrorStatus(err)
	if !ok || status != 404 {
		t.Fatalf("expected HTTP 404, got %v (ok=%v)", err, ok)
	}
}

func TestPreRecordedGetFile(t *testing.T) {
	pre := prerecordedClient(t)
	init, result := createAndPollShort(t, pre)
	if result.Status != "done" {
		t.Fatal(result.Status)
	}
	data, err := pre.GetFile(context.Background(), init.Id)
	if err != nil {
		t.Fatal(err)
	}
	if len(data) < 4 || string(data[:4]) != "RIFF" {
		t.Fatal("expected RIFF WAV bytes")
	}
}

func TestPreRecordedTranscribeLocalFile(t *testing.T) {
	pre := prerecordedClient(t)
	ctx, cancel := pollContext(t, pollTimeout)
	defer cancel()
	opts := map[string]any{
		"language_config": map[string]any{"languages": []string{"en"}},
	}
	result, err := pre.Transcribe(ctx, shortAudioPath(), opts, pollInterval)
	if err != nil {
		t.Fatal(err)
	}
	if result.Status != "done" || result.Result == nil || result.Result.Transcription == nil {
		t.Fatalf("transcribe: %+v", result)
	}
	assertSplitInfinityTranscript(t, result.Result.Transcription.FullTranscript)
}

func TestPreRecordedTranscribeWithOptionsDict(t *testing.T) {
	pre := prerecordedClient(t)
	ctx, cancel := pollContext(t, pollTimeout)
	defer cancel()
	opts := map[string]any{
		"language_config":    map[string]any{"languages": []string{"en"}},
		"sentiment_analysis": true,
	}
	result, err := pre.Transcribe(ctx, shortAudioPath(), opts, pollInterval)
	if err != nil {
		t.Fatal(err)
	}
	if result.Result == nil || result.Result.Transcription == nil {
		t.Fatal("expected transcription")
	}
}

func TestPreRecordedTranscribeNamedEntityRecognition(t *testing.T) {
	pre := prerecordedClient(t)
	ctx, cancel := pollContext(t, pollTimeout)
	defer cancel()
	opts := map[string]any{
		"language_config":          map[string]any{"languages": []string{"en"}},
		"named_entity_recognition": true,
	}
	result, err := pre.Transcribe(ctx, dataPath(annaSashaAudioFile), opts, pollInterval)
	if err != nil {
		t.Fatal(err)
	}
	if result.Result == nil || result.Result.Transcription == nil {
		t.Fatal("expected transcription")
	}
	full := strings.ToLower(result.Result.Transcription.FullTranscript)
	if !strings.Contains(full, "sasha") {
		t.Fatalf("expected sasha in transcript %q", full)
	}
	ner := result.Result.NamedEntityRecognition
	if ner == nil {
		t.Fatal("expected NER addon")
	}
	if !ner.Success {
		t.Fatalf("NER failed: %v", ner.Error)
	}
	var sashaGiven bool
	for _, r := range ner.Results {
		if strings.Contains(strings.ToLower(r.Text), "sasha") && strings.EqualFold(r.EntityType, "NAME_GIVEN") {
			sashaGiven = true
			break
		}
	}
	if !sashaGiven {
		t.Fatalf("expected NAME_GIVEN for Sasha, got %+v", ner.Results)
	}
}

func TestPreRecordedTranscribeURL(t *testing.T) {
	pre := prerecordedClient(t)
	ctx, cancel := pollContext(t, youtubePollTimeout)
	defer cancel()
	opts := map[string]any{
		"language_config": map[string]any{"languages": []string{"en"}},
	}
	result, err := pre.Transcribe(ctx, youtubeURL, opts, pollInterval)
	if err != nil {
		t.Fatal(err)
	}
	if result.Result == nil || result.Result.Transcription == nil {
		t.Fatal("expected result")
	}
	if strings.TrimSpace(result.Result.Transcription.FullTranscript) == "" {
		t.Fatal("expected non-empty transcript")
	}
}

func TestPreRecordedCreateAndPoll(t *testing.T) {
	pre := prerecordedClient(t)
	upload := uploadShortAudio(t, pre)
	ctx, cancel := pollContext(t, pollTimeout)
	defer cancel()
	result, err := pre.CreateAndPoll(ctx, prerecordedCreateBody(upload.AudioUrl), pollInterval)
	if err != nil {
		t.Fatal(err)
	}
	if result.Status != "done" || result.Result == nil {
		t.Fatalf("create_and_poll: status=%q", result.Status)
	}
}
