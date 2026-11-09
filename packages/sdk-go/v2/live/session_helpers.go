package live

import (
	"encoding/json"
	"fmt"
	"net/url"

	"github.com/gladiaio/sdk-go/clientoptions"
	"github.com/gladiaio/sdk-go/network"
)

const maxResumeChunkBytes = 512 * 1024

func buildLiveInitPath(region clientoptions.Region) string {
	if region == "" {
		return "/v2/live"
	}
	return "/v2/live?" + url.Values{"region": {string(region)}}.Encode()
}

func buildInitBody(init map[string]any, apiURL string) map[string]any {
	body := make(map[string]any, len(init)+1)
	for k, v := range init {
		body[k] = v
	}
	var mc map[string]any
	if raw, ok := body["messages_config"].(map[string]any); ok {
		mc = make(map[string]any, len(raw)+1)
		for k, v := range raw {
			mc[k] = v
		}
	} else {
		mc = map[string]any{}
	}
	mc["receive_acknowledgments"] = true
	body["messages_config"] = mc
	return InitBodyFor(body, apiURL)
}

func parseWSMessage(data []byte) (map[string]any, error) {
	var msg map[string]any
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("invalid message received: %s", string(data))
	}
	if msg == nil || msg["type"] == nil {
		return nil, fmt.Errorf("invalid message received: %s", string(data))
	}
	return msg, nil
}

func shouldEmitWSMessage(msg map[string]any, cfg *LiveV2MessagesConfig) bool {
	if cfg == nil {
		return true
	}
	if cfg.ReceiveAcknowledgments != nil && *cfg.ReceiveAcknowledgments {
		return true
	}
	_, hasAck := msg["acknowledged"]
	return !hasAck
}

func acknowledgedByteEnd(msg map[string]any) (int, error) {
	data, _ := msg["data"].(map[string]any)
	if data == nil {
		return 0, fmt.Errorf("invalid audio_chunk acknowledgment: bad byte_range")
	}
	br, _ := data["byte_range"].([]any)
	if len(br) < 2 {
		return 0, fmt.Errorf("invalid audio_chunk acknowledgment: bad byte_range")
	}
	switch end := br[1].(type) {
	case float64:
		if end < 0 || end != float64(int(end)) {
			return 0, fmt.Errorf("invalid audio_chunk acknowledgment: bad byte_range")
		}
		return int(end), nil
	case json.Number:
		n, err := end.Int64()
		if err != nil || n < 0 {
			return 0, fmt.Errorf("invalid audio_chunk acknowledgment: bad byte_range")
		}
		return int(n), nil
	default:
		return 0, fmt.Errorf("invalid audio_chunk acknowledgment: bad byte_range")
	}
}

func trimAcknowledgedBuffer(buf []byte, bytesSent, byteEnd int) ([]byte, int) {
	if byteEnd <= bytesSent {
		return buf, bytesSent
	}
	drop := byteEnd - bytesSent
	if drop > len(buf) {
		drop = len(buf)
	}
	return buf[drop:], byteEnd
}

func sendAudioInChunks(ws *network.WebSocketSession, audio []byte) {
	for off := 0; off < len(audio); off += maxResumeChunkBytes {
		end := min(off+maxResumeChunkBytes, len(audio))
		_ = ws.Send(audio[off:end])
	}
}

func messagesConfigFromInit(init map[string]any) *LiveV2MessagesConfig {
	raw, ok := init["messages_config"].(map[string]any)
	if !ok {
		return nil
	}
	b, err := json.Marshal(raw)
	if err != nil {
		return nil
	}
	var cfg LiveV2MessagesConfig
	if json.Unmarshal(b, &cfg) != nil {
		return nil
	}
	return &cfg
}

func receiveLifecycleEvents(cfg *LiveV2MessagesConfig) bool {
	return cfg != nil && cfg.ReceiveLifecycleEvents != nil && *cfg.ReceiveLifecycleEvents
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
