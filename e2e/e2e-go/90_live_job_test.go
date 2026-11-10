package e2e_test

import (
	"context"
	"testing"
)

// One live session per test group — plans with a single concurrent session cannot run
// separate job tests that each start their own session.
func TestLiveJobManagement(t *testing.T) {
	jobID := runLiveSession(t, nil)
	lc := liveClient(t)
	ctx := context.Background()

	result, err := lc.Get(ctx, jobID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if result.Id != jobID || result.Kind != "live" {
		t.Fatalf("get: id=%q kind=%q", result.Id, result.Kind)
	}
	if result.Status != "done" && result.Status != "processing" {
		t.Fatalf("get status=%q", result.Status)
	}

	data, err := lc.GetFile(ctx, jobID)
	if err != nil {
		t.Fatalf("get_file: %v", err)
	}
	if len(data) < 4 || string(data[:4]) != "RIFF" {
		t.Fatal("expected RIFF header")
	}

	findLiveJobInList(t, lc, jobID)

	waitLiveJobTerminal(t, lc, jobID)
	ok, err := lc.Delete(ctx, jobID)
	if err != nil {
		t.Fatalf("delete: %v", err)
	}
	if !ok {
		t.Fatal("expected delete success")
	}
}

func TestLiveDeleteNonexistent(t *testing.T) {
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
