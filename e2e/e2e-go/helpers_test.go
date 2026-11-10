package e2e_test

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gladiaio/sdk-go"
	"github.com/gladiaio/sdk-go/clientoptions"
	"github.com/gladiaio/sdk-go/network"
	"github.com/gladiaio/sdk-go/v2/live"
	"github.com/gladiaio/sdk-go/v2/prerecorded"
)

const (
	shortAudioFile     = "short_split_infinity_16k.wav"
	annaSashaAudioFile = "anna-and-sasha-16000.wav"
	pollInterval       = 2 * time.Second
	pollTimeout        = 3 * time.Minute // e2e-python POLL_TIMEOUT_S
	listTimeout        = 2 * time.Minute
	youtubePollTimeout = 10 * time.Minute
	liveConnectTimeout = 45 * time.Second
	liveJobWaitTimeout = 90 * time.Second // e2e-python job terminal wait (60s) + slack
	liveSlotCooldown   = 15 * time.Second
	liveStartAttempts  = 5
	e2eHTTPTimeout     = 5 * time.Minute
	youtubeURL         = "https://www.youtube.com/watch?v=DYyY8Nh3TQE"
	nonexistentJobID   = "00000000-0000-0000-0000-000000000000"
)

var liveE2EMu sync.Mutex

func acquireLiveSlot(t *testing.T) {
	t.Helper()
	liveE2EMu.Lock()
	time.Sleep(liveSlotCooldown)
	t.Cleanup(func() {
		time.Sleep(liveSlotCooldown)
		liveE2EMu.Unlock()
	})
}

// AudioConfig is the live init audio block parsed from a WAV fixture.
type AudioConfig struct {
	Encoding   string
	SampleRate int
	Channels   int
	BitDepth   int
}

type AudioFile struct {
	Config AudioConfig
	PCM    []byte
}

func dataPath(name string) string {
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "data"))
	return filepath.Join(root, name)
}

func shortAudioPath() string {
	return dataPath(shortAudioFile)
}

func newE2EClient(t *testing.T) *gladia.GladiaClient {
	t.Helper()
	base := clientoptions.Default()
	preTO := base.PreRecordedTimeouts
	preTO.Get = 60 * time.Second
	preTO.List = 60 * time.Second
	preTO.Create = 2 * time.Minute
	liveTO := base.LiveTimeouts
	liveTO.Get = 60 * time.Second
	liveTO.List = 60 * time.Second
	wsRetry := base.WSRetry
	wsRetry.MaxAttemptsPerConnection = 10
	client, err := gladia.NewGladiaClient(&clientoptions.GladiaClientOptions{
		HTTPTimeout:         e2eHTTPTimeout,
		WSTimeout:           2 * time.Minute,
		WSRetry:             wsRetry,
		PreRecordedTimeouts: preTO,
		LiveTimeouts:        liveTO,
	})
	if err != nil {
		t.Fatalf("NewGladiaClient: %v", err)
	}
	return client
}

func prerecordedClient(t *testing.T) *prerecorded.Client {
	t.Helper()
	root := newE2EClient(t)
	pre, err := root.PreRecordedV2(nil)
	if err != nil {
		t.Fatal(err)
	}
	return pre
}

func liveClient(t *testing.T) *live.Client {
	t.Helper()
	root := newE2EClient(t)
	lc, err := root.LiveV2(nil)
	if err != nil {
		t.Fatal(err)
	}
	return lc
}

func pollContext(t *testing.T, timeout time.Duration) (context.Context, context.CancelFunc) {
	t.Helper()
	return context.WithTimeout(context.Background(), timeout)
}

func prerecordedCreateBody(audioURL string) map[string]any {
	return map[string]any{
		"audio_url": audioURL,
		"language_config": map[string]any{
			"languages": []string{"en"},
		},
	}
}

func uploadShortAudio(t *testing.T, pre *prerecorded.Client) *prerecorded.PreRecordedV2AudioUploadResponse {
	t.Helper()
	ctx := context.Background()
	upload, err := pre.UploadFile(ctx, shortAudioPath())
	if err != nil {
		t.Fatalf("upload: %v", err)
	}
	if upload.AudioUrl == "" {
		t.Fatal("expected audio_url")
	}
	return upload
}

func createAndPollShort(t *testing.T, pre *prerecorded.Client) (*prerecorded.PreRecordedV2InitTranscriptionResponse, *prerecorded.PreRecordedV2Response) {
	t.Helper()
	upload := uploadShortAudio(t, pre)
	createCtx, createCancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer createCancel()
	init, err := pre.Create(createCtx, prerecordedCreateBody(upload.AudioUrl))
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	pollCtx, pollCancel := context.WithTimeout(context.Background(), pollTimeout)
	defer pollCancel()
	result, err := pre.Poll(pollCtx, init.Id, pollInterval)
	if err != nil {
		t.Fatalf("poll: %v", err)
	}
	return init, result
}

func afterDateISO() string {
	return time.Now().UTC().Add(-24 * time.Hour).Format("2006-01-02T15:04:05.000Z")
}

func findPreRecordedJobInList(t *testing.T, pre *prerecorded.Client, jobID string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), listTimeout)
	defer cancel()
	limit := 20
	after := afterDateISO()
	page, err := pre.List(ctx, prerecorded.PreRecordedV2ListParams{
		Limit:     &limit,
		Status:    []string{"done"},
		AfterDate: &after,
	})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	found := listContainsPreRecorded(page.Items, jobID)
	pages := 1
	for !found && page.Next != nil && *page.Next != "" && pages < 10 {
		next := *page.Next
		page, err = pre.List(ctx, prerecorded.PreRecordedV2ListParams{Url: &next})
		if err != nil {
			t.Fatalf("list page: %v", err)
		}
		found = listContainsPreRecorded(page.Items, jobID)
		pages++
	}
	if !found {
		t.Fatalf("expected job %s in list within 10 pages", jobID)
	}
	if page.First == "" || page.Current == "" {
		t.Fatal("expected non-empty first and current URLs")
	}
}

func listContainsPreRecorded(items []prerecorded.PreRecordedV2Response, id string) bool {
	for _, item := range items {
		if item.Id == id {
			return true
		}
	}
	return false
}

func findLiveJobInList(t *testing.T, lc *live.Client, jobID string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), listTimeout)
	defer cancel()
	limit := 20
	after := afterDateISO()
	page, err := lc.List(ctx, live.LiveV2ListParams{
		Limit:     &limit,
		AfterDate: &after,
		Status:    []string{"done", "processing", "queued", "error"},
	})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	found := listContainsLive(page.Items, jobID)
	pages := 1
	for !found && page.Next != nil && *page.Next != "" && pages < 10 {
		next := *page.Next
		page, err = lc.List(ctx, live.LiveV2ListParams{Url: &next})
		if err != nil {
			t.Fatalf("list page: %v", err)
		}
		found = listContainsLive(page.Items, jobID)
		pages++
	}
	if !found {
		t.Fatalf("expected job %s in list within 10 pages", jobID)
	}
	if page.First == "" || page.Current == "" {
		t.Fatal("expected non-empty first and current URLs")
	}
}

func listContainsLive(items []live.LiveV2Response, id string) bool {
	for _, item := range items {
		if item.Id == id {
			return true
		}
	}
	return false
}

func httpErrorStatus(err error) (int, bool) {
	var he *network.HttpError
	if errors.As(err, &he) {
		return he.Status, true
	}
	return 0, false
}

func connectLiveSession(t *testing.T, lc *live.Client, audioFile string, init map[string]any, handlers live.SessionHandlers) (*live.Session, AudioFile) {
	t.Helper()
	acquireLiveSlot(t)
	audio, err := parseWAV(dataPath(audioFile))
	if err != nil {
		t.Fatal(err)
	}
	if init == nil {
		init = liveInitBody(audio)
	}
	ctx := context.Background()
	var lastErr error
	for attempt := 1; attempt <= liveStartAttempts; attempt++ {
		if attempt > 1 {
			time.Sleep(time.Duration(attempt) * liveSlotCooldown)
		}
		sess, err := lc.StartSession(ctx, init)
		if err != nil {
			lastErr = err
			continue
		}
		sess.SetHandlers(handlers)
		connectCtx, cancel := context.WithTimeout(ctx, liveConnectTimeout)
		waitErr := sess.WaitUntilConnected(connectCtx)
		cancel()
		if waitErr == nil {
			return sess, audio
		}
		lastErr = waitErr
		if id := sess.SessionID(); id != "" {
			t.Logf("live start attempt %d failed after session %s created: %v", attempt, id, waitErr)
			delCtx, delCancel := context.WithTimeout(context.Background(), time.Minute)
			_, _ = lc.Delete(delCtx, id)
			delCancel()
		}
		sess.EndSession()
		_ = sess.WaitEnded(30 * time.Second)
	}
	t.Fatalf("live session could not connect after %d attempts (last: %v)", liveStartAttempts, lastErr)
	return nil, AudioFile{}
}

func streamLiveAudioUntilEnded(t *testing.T, sess *live.Session, audio AudioFile, ended <-chan struct{}) {
	t.Helper()
	stopSend := make(chan struct{})
	go func() {
		sendAudioChunks(audio, sess.SendAudio, 50*time.Millisecond, stopSend)
		sess.StopRecording()
	}()
	wait := liveSessionWaitTimeout(audio)
	select {
	case <-ended:
		close(stopSend)
	case <-time.After(wait):
		close(stopSend)
		t.Fatalf("timed out waiting for session end after %v", wait)
	}
	_ = sess.WaitEnded(30 * time.Second)
}

func runLiveSession(t *testing.T, init map[string]any) string {
	t.Helper()
	lc := liveClient(t)
	ended := make(chan struct{}, 1)
	sess, audio := connectLiveSession(t, lc, shortAudioFile, init, live.SessionHandlers{
		OnError: func(err error) { t.Logf("live session error: %v", err) },
		OnEnded: func(int, string) {
			select {
			case ended <- struct{}{}:
			default:
			}
		},
	})
	streamLiveAudioUntilEnded(t, sess, audio, ended)
	jobID := sess.SessionID()
	if jobID == "" {
		t.Fatal("expected session id")
	}
	return jobID
}

func waitLiveJobTerminal(t *testing.T, lc *live.Client, jobID string) *live.LiveV2Response {
	t.Helper()
	ctx := context.Background()
	deadline := time.Now().Add(liveJobWaitTimeout)
	for {
		result, err := lc.Get(ctx, jobID)
		if err != nil {
			t.Fatalf("get: %v", err)
		}
		if result.Status == "done" || result.Status == "error" {
			if result.Status == "error" {
				t.Fatalf("job %s ended with error", jobID)
			}
			return result
		}
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for terminal status (last %q)", result.Status)
		}
		time.Sleep(time.Second)
	}
}

func parseWAV(path string) (AudioFile, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return AudioFile{}, err
	}
	if len(raw) < 44 || string(raw[0:4]) != "RIFF" || string(raw[8:12]) != "WAVE" || string(raw[12:16]) != "fmt " {
		return AudioFile{}, fmt.Errorf("unsupported file format")
	}
	fmtSize := binary.LittleEndian.Uint32(raw[16:20])
	format := binary.LittleEndian.Uint16(raw[20:22])
	var encoding string
	switch format {
	case 1:
		encoding = "wav/pcm"
	case 6:
		encoding = "wav/alaw"
	case 7:
		encoding = "wav/ulaw"
	default:
		return AudioFile{}, fmt.Errorf("unsupported encoding %d", format)
	}
	channels := int(binary.LittleEndian.Uint16(raw[22:24]))
	sampleRate := int(binary.LittleEndian.Uint32(raw[24:28]))
	bitDepth := int(binary.LittleEndian.Uint16(raw[34:36]))

	next := 16 + 4 + int(fmtSize)
	for next+8 <= len(raw) && string(raw[next:next+4]) != "data" {
		chunkSize := int(binary.LittleEndian.Uint32(raw[next+4 : next+8]))
		next += 8 + chunkSize
	}
	if next+8 > len(raw) {
		return AudioFile{}, fmt.Errorf("missing data chunk")
	}
	dataSize := int(binary.LittleEndian.Uint32(raw[next+4 : next+8]))
	start := next + 8
	end := start + dataSize
	if end > len(raw) {
		end = len(raw)
	}
	return AudioFile{
		Config: AudioConfig{
			Encoding:   encoding,
			SampleRate: sampleRate,
			Channels:   channels,
			BitDepth:   bitDepth,
		},
		PCM: raw[start:end],
	}, nil
}

// liveSessionWaitTimeout covers real-time audio streaming plus post-processing (aligned with e2e-python ended waits).
func liveSessionWaitTimeout(audio AudioFile) time.Duration {
	chunk := chunkSize(audio, 50*time.Millisecond)
	if chunk <= 0 {
		return 2 * time.Minute
	}
	chunks := (len(audio.PCM) + chunk - 1) / chunk
	stream := time.Duration(chunks) * 50 * time.Millisecond
	return stream + 90*time.Second
}

func chunkSize(audio AudioFile, chunkDuration time.Duration) int {
	bytesPerSample := audio.Config.BitDepth / 8
	bytesPerSecond := audio.Config.SampleRate * audio.Config.Channels * bytesPerSample
	return int(float64(bytesPerSecond) * chunkDuration.Seconds())
}

func sendAudioChunks(audio AudioFile, send func([]byte), chunkDuration time.Duration, done <-chan struct{}) {
	size := chunkSize(audio, chunkDuration)
	for i := 0; i < len(audio.PCM); i += size {
		select {
		case <-done:
			return
		default:
		}
		end := i + size
		if end > len(audio.PCM) {
			end = len(audio.PCM)
		}
		send(audio.PCM[i:end])
		time.Sleep(chunkDuration)
	}
}

func liveInitBody(audio AudioFile) map[string]any {
	return map[string]any{
		"encoding":    audio.Config.Encoding,
		"bit_depth":   audio.Config.BitDepth,
		"sample_rate": audio.Config.SampleRate,
		"channels":    audio.Config.Channels,
		"language_config": map[string]any{
			"languages": []string{"en"},
		},
		"messages_config": map[string]any{
			"receive_acknowledgments":   true,
			"receive_final_transcripts": true,
		},
	}
}

func liveInitBodyWithNER(audio AudioFile) map[string]any {
	body := liveInitBody(audio)
	body["realtime_processing"] = map[string]any{
		"named_entity_recognition": true,
	}
	body["messages_config"] = map[string]any{
		"receive_final_transcripts":          true,
		"receive_realtime_processing_events": true,
	}
	return body
}

func splitInfinityPattern() string {
	return `(?i)^\s*split infinity\p{P}*$`
}

func assertSplitInfinityTranscript(t *testing.T, full string) {
	t.Helper()
	full = strings.TrimSpace(full)
	pat := regexp.MustCompile(`(?i)^\s*split infinity\p{P}*\s*$`)
	if !pat.MatchString(full) {
		t.Fatalf("unexpected transcript %q", full)
	}
}
