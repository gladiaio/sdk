package e2e_test

import (
	"regexp"
	"strings"
	"sync"
	"testing"

	"github.com/gladiaio/sdk-go/v2/live"
)

func TestLiveSessionSplitInfinity(t *testing.T) {
	lc := liveClient(t)
	ended := make(chan struct{}, 1)
	var mu sync.Mutex
	var transcripts []string

	sess, audio := connectLiveSession(t, lc, shortAudioFile, nil, live.SessionHandlers{
		OnError: func(err error) { t.Logf("session error: %v", err) },
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

	streamLiveAudioUntilEnded(t, sess, audio, ended)

	mu.Lock()
	joined := strings.TrimSpace(strings.Join(transcripts, " "))
	mu.Unlock()

	pat := regexp.MustCompile(`(?i)^\s*split infinity\p{P}*$`)
	if !pat.MatchString(joined) {
		t.Fatalf("unexpected transcript %q", joined)
	}
}

func TestLiveSessionNamedEntityRecognition(t *testing.T) {
	lc := liveClient(t)
	audioFile := annaSashaAudioFile
	audio, err := parseWAV(dataPath(audioFile))
	if err != nil {
		t.Fatal(err)
	}
	init := liveInitBodyWithNER(audio)

	ended := make(chan struct{}, 1)
	var mu sync.Mutex
	var transcripts []string
	var nerEntities []struct{ entityType, text string }

	sess, audio := connectLiveSession(t, lc, audioFile, init, live.SessionHandlers{
		OnError: func(err error) { t.Logf("session error: %v", err) },
		OnMessage: func(msg map[string]any) {
			switch msg["type"] {
			case "transcript":
				data, _ := msg["data"].(map[string]any)
				if data == nil {
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
			case "named_entity_recognition":
				data, _ := msg["data"].(map[string]any)
				if data == nil {
					return
				}
				results, _ := data["results"].([]any)
				mu.Lock()
				for _, raw := range results {
					m, _ := raw.(map[string]any)
					if m == nil {
						continue
					}
					et, _ := m["entity_type"].(string)
					tx, _ := m["text"].(string)
					nerEntities = append(nerEntities, struct{ entityType, text string }{et, tx})
				}
				mu.Unlock()
			}
		},
		OnEnded: func(int, string) {
			select {
			case ended <- struct{}{}:
			default:
			}
		},
	})

	streamLiveAudioUntilEnded(t, sess, audio, ended)

	mu.Lock()
	full := strings.ToLower(strings.Join(transcripts, " "))
	entities := append([]struct{ entityType, text string }{}, nerEntities...)
	mu.Unlock()

	if !strings.Contains(full, "sasha") {
		t.Fatalf("expected sasha in live transcript %q", full)
	}
	var sashaGiven bool
	for _, e := range entities {
		if strings.Contains(strings.ToLower(e.text), "sasha") && strings.EqualFold(e.entityType, "NAME_GIVEN") {
			sashaGiven = true
			break
		}
	}
	if !sashaGiven {
		t.Fatalf("expected NAME_GIVEN for Sasha; entities=%+v", entities)
	}
}
