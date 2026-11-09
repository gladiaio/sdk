package e2e_test

import (
	"context"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gladiaio/sdk-go/v2/live"
)

func TestLiveSessionSplitInfinity(t *testing.T) {
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

	var mu sync.Mutex
	var transcripts []string
	ended := make(chan struct{}, 1)

	sess.SetHandlers(live.SessionHandlers{
		OnError: func(err error) {
			t.Logf("session error: %v", err)
		},
		OnMessage: func(msg map[string]any) {
			if msg["type"] != "transcript" {
				return
			}
			data, _ := msg["data"].(map[string]any)
			if data == nil {
				return
			}
			isFinal, _ := data["is_final"].(bool)
			if !isFinal {
				return
			}
			utterance, _ := data["utterance"].(map[string]any)
			if utterance == nil {
				return
			}
			text, _ := utterance["text"].(string)
			mu.Lock()
			transcripts = append(transcripts, text)
			mu.Unlock()
		},
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

	mu.Lock()
	joined := strings.TrimSpace(strings.Join(transcripts, " "))
	mu.Unlock()

	pat := regexp.MustCompile(`(?i)^\s*split infinity\p{P}*$`)
	if !pat.MatchString(joined) {
		t.Fatalf("unexpected transcript %q", joined)
	}
}
