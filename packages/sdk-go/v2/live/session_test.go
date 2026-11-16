package live

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/gladiaio/sdk/packages/sdk-go/clientoptions"
	"github.com/gladiaio/sdk/packages/sdk-go/network"
)

// fakeConn records what one WebSocket connection received.
type fakeConn struct {
	mu    sync.Mutex
	audio []byte
	texts []string
	conn  *websocket.Conn
}

func (c *fakeConn) snapshot() ([]byte, []string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	return append([]byte(nil), c.audio...), append([]string(nil), c.texts...)
}

// fakeServer is a minimal live WebSocket endpoint. onFrame runs for every
// frame received; it may close the connection to simulate a drop.
type fakeServer struct {
	t       *testing.T
	srv     *httptest.Server
	mu      sync.Mutex
	conns   []*fakeConn
	onFrame func(s *fakeServer, c *fakeConn, typ websocket.MessageType, data []byte)
}

func newFakeServer(t *testing.T, onFrame func(*fakeServer, *fakeConn, websocket.MessageType, []byte)) *fakeServer {
	t.Helper()
	fs := &fakeServer{t: t, onFrame: onFrame}
	fs.srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, nil)
		if err != nil {
			return
		}
		conn.SetReadLimit(-1)
		fc := &fakeConn{conn: conn}
		fs.mu.Lock()
		fs.conns = append(fs.conns, fc)
		fs.mu.Unlock()
		for {
			typ, data, err := conn.Read(context.Background())
			if err != nil {
				return
			}
			fc.mu.Lock()
			if typ == websocket.MessageBinary {
				fc.audio = append(fc.audio, data...)
			} else {
				fc.texts = append(fc.texts, string(data))
			}
			fc.mu.Unlock()
			if fs.onFrame != nil {
				fs.onFrame(fs, fc, typ, data)
			}
		}
	}))
	t.Cleanup(fs.srv.Close)
	return fs
}

func (fs *fakeServer) wsURL() string { return "ws" + strings.TrimPrefix(fs.srv.URL, "http") }

func (fs *fakeServer) connections() []*fakeConn {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	return append([]*fakeConn(nil), fs.conns...)
}

// conn waits until the server registered connection i (it may lag the client's OnConnected).
func (fs *fakeServer) conn(t *testing.T, i int) *fakeConn {
	t.Helper()
	eventually(t, "server connection", func() bool { return len(fs.connections()) > i })
	return fs.connections()[i]
}

func (fs *fakeServer) ack(c *fakeConn, end int) {
	msg, _ := json.Marshal(map[string]any{
		"type":         "audio_chunk",
		"acknowledged": true,
		"data":         map[string]any{"byte_range": []int{0, end}},
	})
	_ = c.conn.Write(context.Background(), websocket.MessageText, msg)
}

// closeOnStop ends the session like the server does after stop_recording.
func closeOnStop(_ *fakeServer, c *fakeConn, typ websocket.MessageType, data []byte) {
	if typ == websocket.MessageText && strings.Contains(string(data), "stop_recording") {
		_ = c.conn.Close(websocket.StatusNormalClosure, "")
	}
}

func testWSClient(t *testing.T) *network.WebSocketClient {
	t.Helper()
	ws, err := network.NewWebSocketClient(network.WebSocketClientConfig{
		BaseURL: "wss://example.invalid",
		Retry: clientoptions.WebSocketRetryOptions{
			MaxAttemptsPerConnection: 5,
			Delay:                    func(int) time.Duration { return time.Millisecond },
			CloseCodes:               []clientoptions.StatusCodeMatcher{{Start: 1002, End: 4399}},
		},
		Timeout: 5 * time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	return ws
}

func connectTestSession(t *testing.T, url string, h SessionHandlers) *Session {
	t.Helper()
	s := newSession(sessionConfig{
		existing: &LiveV2InitResponse{ID: "sess-1", URL: url, CreatedAt: "2026-01-01T00:00:00Z"},
		ws:       testWSClient(t),
		handlers: h,
	})
	s.start()
	t.Cleanup(s.EndSession)
	return s
}

func waitConnected(t *testing.T, s *Session) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := s.WaitUntilConnected(ctx); err != nil {
		t.Fatalf("wait connected: %v", err)
	}
}

func waitEnded(t *testing.T, s *Session) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := s.WaitEnded(ctx); err != nil {
		t.Fatalf("wait ended: %v", err)
	}
}

func eventually(t *testing.T, what string, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for !cond() {
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for %s", what)
		}
		time.Sleep(5 * time.Millisecond)
	}
}

func (s *Session) bufferState() ([]byte, int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]byte(nil), s.audioBuffer...), s.bufferOffset
}

func TestConnectSessionSkipsHTTPInit(t *testing.T) {
	fs := newFakeServer(t, nil)
	started := make(chan *LiveV2InitResponse, 1)
	s := connectTestSession(t, fs.wsURL(), SessionHandlers{
		OnStarted: func(r *LiveV2InitResponse) { started <- r },
	})
	select {
	case r := <-started:
		if r.ID != "sess-1" {
			t.Fatalf("started with %q", r.ID)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for started")
	}
	waitConnected(t, s)
	if s.SessionID() != "sess-1" || s.Status() != SessionStatusConnected {
		t.Fatalf("id=%q status=%q", s.SessionID(), s.Status())
	}
}

func TestTrimAcknowledgedBuffer(t *testing.T) {
	buf := []byte{1, 2, 3, 4, 5, 6}
	buf, off := trimAcknowledgedBuffer(buf, 0, 4)
	if !bytes.Equal(buf, []byte{5, 6}) || off != 4 {
		t.Fatalf("partial ack: %v %d", buf, off)
	}
	buf, off = trimAcknowledgedBuffer(buf, off, 2) // stale
	if !bytes.Equal(buf, []byte{5, 6}) || off != 4 {
		t.Fatalf("stale ack moved buffer: %v %d", buf, off)
	}
	buf, off = trimAcknowledgedBuffer(buf, off, 4) // duplicate
	if !bytes.Equal(buf, []byte{5, 6}) || off != 4 {
		t.Fatalf("duplicate ack moved buffer: %v %d", buf, off)
	}
	buf, off = trimAcknowledgedBuffer(buf, off, 1<<40) // beyond sent
	if len(buf) != 0 || off != 1<<40 {
		t.Fatalf("over ack: %v %d", buf, off)
	}
}

// Port of JS "only drops newly acknowledged audio from the resend buffer".
func TestSessionOnlyDropsNewlyAcknowledgedAudio(t *testing.T) {
	fs := newFakeServer(t, nil)
	var errMu sync.Mutex
	var errs []error
	s := connectTestSession(t, fs.wsURL(), SessionHandlers{
		OnError: func(err error) { errMu.Lock(); errs = append(errs, err); errMu.Unlock() },
	})
	waitConnected(t, s)
	s.SendAudio([]byte{1, 2, 3, 4, 5, 6})

	c := fs.conn(t, 0)
	expectBuffer := func(want []byte) {
		t.Helper()
		eventually(t, "buffer "+string(want), func() bool {
			got, _ := s.bufferState()
			return bytes.Equal(got, want)
		})
	}
	fs.ack(c, 4)
	expectBuffer([]byte{5, 6})
	fs.ack(c, 2) // stale ack must not move the buffer backwards
	fs.ack(c, 5)
	expectBuffer([]byte{6})
	fs.ack(c, 1<<40) // beyond what was sent empties the buffer
	expectBuffer([]byte{})

	errMu.Lock()
	defer errMu.Unlock()
	if len(errs) != 0 {
		t.Fatalf("unexpected errors: %v", errs)
	}
}

func TestSessionInvalidAckByteRange(t *testing.T) {
	cases := []string{
		`{}`,
		`{"byte_range":null}`,
		`{"byte_range":[0]}`,
		`{"byte_range":[0,"x"]}`,
		`{"byte_range":[0,-1]}`,
		`{"byte_range":[0,1.5]}`,
	}
	for _, data := range cases {
		t.Run(data, func(t *testing.T) {
			s := newSession(sessionConfig{existing: &LiveV2InitResponse{ID: "x"}})
			errs := 0
			s.handlers.OnError = func(error) { errs++ }
			s.audioBuffer = []byte{1, 2, 3}
			s.onMessage([]byte(`{"type":"audio_chunk","acknowledged":true,"data":` + data + `}`))
			if errs != 1 {
				t.Fatalf("expected 1 error, got %d", errs)
			}
			if buf, off := s.bufferState(); !bytes.Equal(buf, []byte{1, 2, 3}) || off != 0 {
				t.Fatalf("buffer changed: %v %d", buf, off)
			}
		})
	}
}

func TestSessionMalformedMessagesEmitErrors(t *testing.T) {
	for _, data := range []string{"not json {", "null", "42", `"text"`, `{"data":{}}`} {
		s := newSession(sessionConfig{existing: &LiveV2InitResponse{ID: "x"}})
		var errs, msgs int
		s.handlers.OnError = func(error) { errs++ }
		s.handlers.OnMessage = func(map[string]any) { msgs++ }
		s.onMessage([]byte(data))
		s.onMessage([]byte(`{"type":"end_of_turn","data":{}}`))
		if errs != 1 || msgs != 1 {
			t.Fatalf("%q: errs=%d msgs=%d", data, errs, msgs)
		}
	}
}

func TestSessionReplaysUnacknowledgedAudioOnReconnect(t *testing.T) {
	var dropped sync.Once
	fs := newFakeServer(t, func(fs *fakeServer, c *fakeConn, typ websocket.MessageType, _ []byte) {
		if typ != websocket.MessageBinary {
			return
		}
		audio, _ := c.snapshot()
		if len(audio) == 6 && len(fs.connections()) == 1 {
			// Acknowledge the first 2 bytes, then drop the connection.
			fs.ack(c, 2)
			time.Sleep(20 * time.Millisecond)
			dropped.Do(func() { _ = c.conn.Close(websocket.StatusInternalError, "drop") })
		}
	})
	reconnected := make(chan struct{})
	var connects int
	s := connectTestSession(t, fs.wsURL(), SessionHandlers{
		// Count on the client side: the server may not have registered the
		// connection yet when OnConnected runs.
		OnConnected: func(int) {
			if connects++; connects == 2 {
				close(reconnected)
			}
		},
	})
	waitConnected(t, s)
	s.SendAudio([]byte{1, 2, 3})
	s.SendAudio([]byte{4, 5, 6})

	select {
	case <-reconnected:
	case <-time.After(5 * time.Second):
		t.Fatal("no reconnect")
	}
	s.SendAudio([]byte{7})
	second := fs.conn(t, 1)
	eventually(t, "replay", func() bool {
		audio, _ := second.snapshot()
		return len(audio) >= 5
	})
	audio, _ := second.snapshot()
	if !bytes.Equal(audio, []byte{3, 4, 5, 6, 7}) {
		t.Fatalf("second connection received %v, want unacked audio then new audio", audio)
	}
}

func TestSessionResendsStopRecordingOnReconnect(t *testing.T) {
	var dropped sync.Once
	fs := newFakeServer(t, func(fs *fakeServer, c *fakeConn, typ websocket.MessageType, data []byte) {
		if typ != websocket.MessageText || !strings.Contains(string(data), "stop_recording") {
			return
		}
		if len(fs.connections()) == 1 {
			dropped.Do(func() { _ = c.conn.Close(websocket.StatusInternalError, "drop") })
			return
		}
		_ = c.conn.Close(websocket.StatusNormalClosure, "")
	})
	s := connectTestSession(t, fs.wsURL(), SessionHandlers{})
	waitConnected(t, s)
	s.SendAudio([]byte{1, 2})
	s.StopRecording()
	waitEnded(t, s)

	conns := fs.connections()
	if len(conns) != 2 {
		t.Fatalf("expected 2 connections, got %d", len(conns))
	}
	audio, texts := conns[1].snapshot()
	if !bytes.Equal(audio, []byte{1, 2}) {
		t.Fatalf("replayed audio %v", audio)
	}
	if len(texts) != 1 || !strings.Contains(texts[0], "stop_recording") {
		t.Fatalf("stop_recording not re-sent after reconnect: %v", texts)
	}
}

func TestSessionAudioBeforeConnectIsBuffered(t *testing.T) {
	fs := newFakeServer(t, closeOnStop)
	s := newSession(sessionConfig{
		existing: &LiveV2InitResponse{ID: "sess-1", URL: fs.wsURL()},
		ws:       testWSClient(t),
	})
	s.SendAudio([]byte{1, 2, 3})
	s.start()
	s.SendAudio([]byte{4})
	waitConnected(t, s)
	s.SendAudio([]byte{5})
	s.StopRecording()
	waitEnded(t, s)
	audio, texts := fs.connections()[0].snapshot()
	if !bytes.Equal(audio, []byte{1, 2, 3, 4, 5}) || len(texts) != 1 {
		t.Fatalf("audio=%v texts=%v", audio, texts)
	}
}

// Streams numbered chunks from several goroutines while the server keeps
// dropping the connection. Without acks every connection must receive a
// contiguous prefix of the stream: no duplicate, missing or reordered chunk.
// Chunks are large so the replay on reconnect spans several frames, which is
// the window where an unserialized SendAudio would interleave. Run with -race.
func TestSessionStreamingDuringReconnectsKeepsOrder(t *testing.T) {
	const (
		drops     = 4
		chunkSize = 16 * 1024
		perWorker = 100
		workers   = 4
	)
	var mu sync.Mutex
	frames := 0
	fs := newFakeServer(t, func(fs *fakeServer, c *fakeConn, typ websocket.MessageType, data []byte) {
		if typ == websocket.MessageText {
			closeOnStop(fs, c, typ, data)
			return
		}
		mu.Lock()
		frames++
		drop := frames%25 == 0 && len(fs.connections()) <= drops
		mu.Unlock()
		if drop {
			_ = c.conn.Close(websocket.StatusInternalError, "drop")
		}
	})
	s := connectTestSession(t, fs.wsURL(), SessionHandlers{})

	var counter uint32
	var counterMu sync.Mutex
	var wg sync.WaitGroup
	for g := 0; g < workers; g++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; i < perWorker; i++ {
				// Hold counterMu across SendAudio so numbering matches call order.
				counterMu.Lock()
				chunk := make([]byte, chunkSize)
				binary.BigEndian.PutUint32(chunk, counter)
				counter++
				s.SendAudio(chunk)
				counterMu.Unlock()
				time.Sleep(200 * time.Microsecond)
			}
		}()
	}
	wg.Wait()
	s.StopRecording()
	waitEnded(t, s)

	conns := fs.connections()
	if len(conns) < 2 {
		t.Fatalf("expected reconnects, got %d connection(s)", len(conns))
	}
	for i, c := range conns {
		audio, _ := c.snapshot()
		for j := 0; j+chunkSize <= len(audio); j += chunkSize {
			if got := binary.BigEndian.Uint32(audio[j:]); got != uint32(j/chunkSize) {
				t.Fatalf("connection %d: chunk %d is #%d (duplicate or out of order)", i, j/chunkSize, got)
			}
		}
	}
	last, texts := conns[len(conns)-1].snapshot()
	if len(last) != workers*perWorker*chunkSize {
		t.Fatalf("last connection received %d bytes, want %d", len(last), workers*perWorker*chunkSize)
	}
	if len(texts) != 1 {
		t.Fatalf("last connection texts: %v", texts)
	}
}
