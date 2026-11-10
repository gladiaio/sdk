package e2e_test

import (
	"context"
	"testing"
)

func TestLiveJobGet(t *testing.T) {
	jobID := runLiveSession(t, nil)
	lc := liveClient(t)
	result, err := lc.Get(context.Background(), jobID)
	if err != nil {
		t.Fatal(err)
	}
	if result.Id != jobID {
		t.Fatalf("id mismatch %q vs %q", result.Id, jobID)
	}
	if result.Kind != "live" {
		t.Fatalf("kind=%q", result.Kind)
	}
	if result.Status != "done" && result.Status != "processing" {
		t.Fatalf("status=%q", result.Status)
	}
}

func TestLiveJobGetFile(t *testing.T) {
	jobID := runLiveSession(t, nil)
	lc := liveClient(t)
	data, err := lc.GetFile(context.Background(), jobID)
	if err != nil {
		t.Fatal(err)
	}
	if len(data) < 4 || string(data[:4]) != "RIFF" {
		t.Fatal("expected RIFF header")
	}
}

func TestLiveJobDelete(t *testing.T) {
	jobID := runLiveSession(t, nil)
	lc := liveClient(t)
	waitLiveJobTerminal(t, lc, jobID)
	ok, err := lc.Delete(context.Background(), jobID)
	if err != nil {
		t.Fatal(err)
	}
	if !ok {
		t.Fatal("expected delete success")
	}
}

func TestLiveJobDeleteNonexistent(t *testing.T) {
	lc := liveClient(t)
	_, err := lc.Delete(context.Background(), nonexistentJobID)
	if err == nil {
		t.Fatal("expected error")
	}
	status, ok := httpErrorStatus(err)
	if !ok || status != 404 {
		t.Fatalf("expected 404, got %v", err)
	}
}

func TestLiveJobList(t *testing.T) {
	jobID := runLiveSession(t, nil)
	lc := liveClient(t)
	findLiveJobInList(t, lc, jobID)
}
