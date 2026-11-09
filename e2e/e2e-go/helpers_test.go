package e2e_test

import (
	"encoding/binary"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/gladiaio/sdk-go"
	"github.com/gladiaio/sdk-go/clientoptions"
)

const (
	shortAudioFile     = "short_split_infinity_16k.wav"
	pollInterval       = 2 * time.Second
	pollTimeout        = 3 * time.Minute
	liveConnectTimeout = 30 * time.Second
	liveSessionTimeout = 2 * time.Minute
	e2eHTTPTimeout     = 90 * time.Second
	youtubeURL         = "https://www.youtube.com/watch?v=DYyY8Nh3TQE"
)

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

func skipWithoutAPIKey(t *testing.T) {
	t.Helper()
	if strings.TrimSpace(os.Getenv("GLADIA_API_KEY")) == "" {
		t.Skip("GLADIA_API_KEY is not set; skipping Gladia API e2e test")
	}
}

func dataPath(name string) string {
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "data"))
	return filepath.Join(root, name)
}

func newE2EClient(t *testing.T) *gladia.GladiaClient {
	t.Helper()
	skipWithoutAPIKey(t)
	client, err := gladia.NewGladiaClient(&clientoptions.GladiaClientOptions{
		HTTPTimeout: e2eHTTPTimeout,
	})
	if err != nil {
		t.Fatalf("NewGladiaClient: %v", err)
	}
	return client
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
	}
}

func prerecordedOptions(audioURL string) map[string]any {
	return map[string]any{
		"audio_url": audioURL,
		"language_config": map[string]any{
			"languages": []string{"en"},
		},
	}
}
