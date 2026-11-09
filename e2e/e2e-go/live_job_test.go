package e2e_test

import (
	"context"
	"testing"
	"time"

	"github.com/gladiaio/sdk-go/v2/live"
)

func TestLiveJobGet(t *testing.T) {
	root := newE2EClient(t)
	liveClient, err := root.LiveV2(nil)
	if err != nil {
		t.Fatal(err)
	}

	audio, err := parseWAV(dataPath(shortAudioFile))
	if err != nil {
		t.Fatal(err)
	}

	ctx := context.Background()
	sess, err := liveClient.StartSession(ctx, liveInitBody(audio))
	if err != nil {
		t.Fatal(err)
	}

	ended := make(chan struct{}, 1)
	sess.SetHandlers(live.SessionHandlers{
		OnEnded: func(int, string) {
			select {
			case ended <- struct{}{}:
			default:
			}
		},
	})

	connectCtx, cancel := context.WithTimeout(ctx, liveConnectTimeout)
	defer cancel()
	if err := sess.WaitUntilConnected(connectCtx); err != nil {
		t.Fatalf("wait connected: %v", err)
	}

	stopSend := make(chan struct{})
	go func() {
		sendAudioChunks(audio, sess.SendAudio, 50*time.Millisecond, stopSend)
		sess.StopRecording()
	}()

	select {
	case <-ended:
		close(stopSend)
	case <-time.After(liveSessionTimeout):
		close(stopSend)
		t.Fatal("timed out waiting for session end")
	}

	jobID := sess.SessionID()
	if jobID == "" {
		t.Fatal("expected session id")
	}

	deadline := time.Now().Add(time.Minute)
	for {
		result, err := liveClient.Get(ctx, jobID)
		if err != nil {
			t.Fatalf("get: %v", err)
		}
		if result.Status == "done" || result.Status == "error" {
			if result.Status != "done" {
				t.Fatalf("job ended with status %q", result.Status)
			}
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for job %s terminal status (last %q)", jobID, result.Status)
		}
		time.Sleep(time.Second)
	}
}
