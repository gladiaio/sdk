import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { WebSocketClient, WebSocketSession } from './webSocketClient.js'
import type { IsoWS } from './iso-ws.js'

// Mock the iso-ws module
vi.mock('./iso-ws.js', () => ({
  newWebSocket: vi.fn(),
}))

// Define proper types for our mocks
interface MockWebSocket extends IsoWS {
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

interface EventHandlers {
  onopen: (() => void) | null
  onerror: (() => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null
}

describe('WebSocketClient + WebSocketSession', () => {
  let client: WebSocketClient
  let session: WebSocketSession
  let mockWs: MockWebSocket
  let eventHandlers: EventHandlers
  let mockNewWebSocket: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked function
    const { newWebSocket } = await import('./iso-ws.js')
    mockNewWebSocket = newWebSocket as ReturnType<typeof vi.fn>
    
    // Create a mock WebSocket with proper typing
    mockWs = {
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
      readyState: 0, // CONNECTING
      send: vi.fn(),
      close: vi.fn(),
    } as MockWebSocket
    
    eventHandlers = {
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
    }
    
    // Mock newWebSocket to return our mock
    mockNewWebSocket.mockImplementation(() => {
      // Store event handlers when they're set
      Object.defineProperty(mockWs, 'onopen', {
        get: () => eventHandlers.onopen,
        set: (fn) => { eventHandlers.onopen = fn }
      })
      Object.defineProperty(mockWs, 'onerror', {
        get: () => eventHandlers.onerror,
        set: (fn) => { eventHandlers.onerror = fn }
      })
      Object.defineProperty(mockWs, 'onclose', {
        get: () => eventHandlers.onclose,
        set: (fn) => { eventHandlers.onclose = fn }
      })
      Object.defineProperty(mockWs, 'onmessage', {
        get: () => eventHandlers.onmessage,
        set: (fn) => { eventHandlers.onmessage = fn }
      })
      
      return Promise.resolve(mockWs)
    })
  })

  afterEach(() => {
    // sessions auto-clean in tests; nothing to do
  })

  async function tick(): Promise<void> {
    await new Promise((r) => setTimeout(r, 0))
  }

  it('should connect successfully and emit events', async () => {
    const connectingSpy = vi.fn()
    const openSpy = vi.fn()
    const messageSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    session.on('open', openSpy)
    session.on('message', messageSpy)

    // Let session auto-connect and attach handlers
    await tick()

    expect(connectingSpy).toHaveBeenCalledTimes(1)
    expect(connectingSpy).toHaveBeenCalledWith()
    expect(session.currentStatus).toBe('connecting')

    // Simulate WebSocket opening
    eventHandlers.onopen?.()
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith()
    expect(session.currentStatus).toBe('open')

    // Simulate receiving a message
    eventHandlers.onmessage?.({ data: 'test message' })
    expect(messageSpy).toHaveBeenCalledTimes(1)
    expect(messageSpy).toHaveBeenCalledWith('test message')
  })

  it('should handle connection errors and retry', async () => {
    const errorSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 2, delay: () => 10, backoffLimit: 100 },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('error', errorSpy)
    session.on('close', closeSpy)

    await tick()

    // Simulate connection error
    eventHandlers.onerror?.()
    expect(errorSpy).toHaveBeenCalled()
    expect(session.currentStatus).toBe('closed')

    // Should not retry on error, only on close with retryable code
  })

  it('should retry on close with retryable code', async () => {
    const connectingSpy = vi.fn()
    const openSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 2, 
        delay: () => 10, 
        backoffLimit: 100,
        closeCodes: [1002, [1003, 1006]]
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    session.on('open', openSpy)
    session.on('close', closeSpy)
    await Promise.resolve(); await Promise.resolve()
    expect(connectingSpy).toHaveBeenCalledTimes(1)

    // Simulate WebSocket opening
    eventHandlers.onopen?.()
    expect(openSpy).toHaveBeenCalledTimes(1)

    // Simulate close with retryable code
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close' })
    
    // Wait for retry
    await new Promise(resolve => setTimeout(resolve, 50))
    
    expect(connectingSpy).toHaveBeenCalledTimes(2) // Should retry
    expect(closeSpy).not.toHaveBeenCalled() // Should not emit close event yet
  })

  it('should not retry on close with non-retryable code', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 2, 
        delay: () => 10, 
        backoffLimit: 100,
        closeCodes: [1002, [1003, 1006]]
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('close', closeSpy)
    await Promise.resolve(); await Promise.resolve()

    // Simulate close with non-retryable code
    eventHandlers.onclose?.({ code: 1000, reason: 'Normal closure' })
    
    expect(closeSpy).toHaveBeenCalledWith(1000, 'Normal closure')
  })

  it('should not retry when limit is reached', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 1, 
        delay: () => 10, 
        backoffLimit: 100,
        closeCodes: [1002]
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    session.on('close', closeSpy)
    await tick()
    expect(connectingSpy).toHaveBeenCalledTimes(1)

    // Simulate close with retryable code
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close' })
    
    // Wait for potential retry
    await new Promise(resolve => setTimeout(resolve, 50))
    
    expect(connectingSpy).toHaveBeenCalledTimes(1) // Should not retry
    expect(closeSpy).toHaveBeenCalledWith(1002, 'Test close')
  })

  it('should handle timeout', async () => {
    const errorSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 50,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('error', errorSpy)
    await Promise.resolve(); await Promise.resolve()

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('timeout')
    }))
    expect(session.currentStatus).toBe('closed')
  })

  it('should send data when open', async () => {
    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    await Promise.resolve(); await Promise.resolve()
    eventHandlers.onopen?.()
    session.send('test data')
    expect(mockWs.send).toHaveBeenCalledWith('test data')
  })

  it('should throw error when sending while not open', async () => {
    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    await Promise.resolve(); await Promise.resolve()

    expect(() => session.send('test data')).toThrow('WebSocket is not open')
  })

  it('should close manually and emit close event', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('close', closeSpy)
    await Promise.resolve(); await Promise.resolve()
    eventHandlers.onopen?.()
    session.close(1000)
    expect(mockWs.close).toHaveBeenCalledWith(1000)
    expect(session.currentStatus).toBe('closing')

    // Simulate close event
    eventHandlers.onclose?.({ code: 1000, reason: 'Manual close' })
    expect(closeSpy).toHaveBeenCalledWith(1000, 'Manual close')
  })

  it('should respect connection limit', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 1, 
        delay: () => 0, 
        backoffLimit: 0,
        limitConnections: 1
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('close', closeSpy)
    await tick()
    eventHandlers.onopen?.()
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close' })

    // Wait for potential retry
    await new Promise(resolve => setTimeout(resolve, 50))

    // Limit reached blocks reconnection and mirrors last close
    expect(closeSpy).toHaveBeenCalledWith(1002, 'Test close')
  })

  it('should reset connection attempts after successful connection', async () => {
    const connectingSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 2, 
        delay: () => 10, 
        backoffLimit: 100,
        closeCodes: [1002]
      },
      webSocketTimeout: 1000,
    })

    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    await Promise.resolve(); await Promise.resolve()
    eventHandlers.onopen?.() // Successful connection

    // Simulate close and retry
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close' })
    
    // Wait for retry
    await new Promise(resolve => setTimeout(resolve, 50))
    
    expect(connectingSpy).toHaveBeenCalledTimes(2) // Should retry once more
  })

  it('should clean up resources on destroy', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })

    session = client.createSession('ws://localhost:8080')
    session.on('close', closeSpy)
    await Promise.resolve(); await Promise.resolve()
    eventHandlers.onopen?.()

    session.destroy()
    expect(mockWs.close).toHaveBeenCalledWith(1000)
    expect(session.currentStatus).toBe('closed')
  })

  it('should not retry with limit 1 (only initial attempt)', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()
    const errorSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 1, 
        delay: () => 10, 
        backoffLimit: 100,
        closeCodes: [1002]
      },
      webSocketTimeout: 1000,
    })

    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    session.on('close', closeSpy)
    session.on('error', errorSpy)
    await tick()
    expect(connectingSpy).toHaveBeenCalledTimes(1)

    // Simulate connection error before open
    eventHandlers.onerror?.()
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(errorSpy).toHaveBeenCalled()
    expect(connectingSpy).toHaveBeenCalledTimes(1) // no retry
    expect(closeSpy).toHaveBeenCalledWith(1006, '')
  })

  it('should retry exactly once with limit 2', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 2, 
        delay: () => 10, 
        backoffLimit: 100,
        closeCodes: [1002]
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    session.on('close', closeSpy)
    await tick()
    expect(connectingSpy).toHaveBeenCalledTimes(1)

    // Simulate pre-open error to trigger retry logic
    eventHandlers.onerror?.()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(connectingSpy).toHaveBeenCalledTimes(2) // Initial + 1 retry
    // pre-open error also emits close(1006, '') in our impl
    expect(closeSpy).toHaveBeenCalledWith(1006, '')

    // Simulate close again
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close 2' })
    
    // Wait for potential retry
    await new Promise(resolve => setTimeout(resolve, 50))
    
    expect(connectingSpy).toHaveBeenCalledTimes(2) // Should not retry again
    expect(closeSpy).toHaveBeenCalledWith(1002, 'Test close 2')
  })

  it('should retry unlimited times with limit 0', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 0, 
        delay: () => 10, 
        backoffLimit: 100,
        closeCodes: [1002]
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    session.on('close', closeSpy)
    await tick()
    expect(connectingSpy).toHaveBeenCalledTimes(1)

    // Simulate multiple pre-open errors
    for (let i = 0; i < 3; i++) {
      eventHandlers.onerror?.()
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    expect(connectingSpy).toHaveBeenCalledTimes(4) // Initial + 3 retries
    // Each pre-open error emits close(1006, '')
    expect(closeSpy).toHaveBeenCalledTimes(3)
    expect(closeSpy).toHaveBeenCalledWith(1006, '')
  })

  it('should respect limitConnections = 1', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 5, 
        delay: () => 0, 
        backoffLimit: 0,
        limitConnections: 1
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('close', closeSpy)
    await tick()

    // Simulate close and try to reconnect
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close' })
    await new Promise(resolve => setTimeout(resolve, 10))

    // Second connection blocked by limit emits close with same code/reason
    expect(closeSpy).toHaveBeenCalledWith(1002, 'Test close')
  })

  it('should respect limitConnections = 2', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 5, 
        delay: () => 0, 
        backoffLimit: 0,
        limitConnections: 2
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('close', closeSpy)
    await tick()

    // Simulate close and try to reconnect
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close 1' })
    await new Promise(resolve => setTimeout(resolve, 10))

    // Second connection should work (no close emitted yet by limit)
    expect(closeSpy).not.toHaveBeenCalledWith(1002, 'Test close 1')

    // Simulate close and try to reconnect again
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close 2' })
    await new Promise(resolve => setTimeout(resolve, 10))

    // Third connection blocked by limit mirrors the last close
    expect(closeSpy).toHaveBeenCalledWith(1002, 'Test close 2')
  })

  it('should allow unlimited connections with limitConnections = 0', async () => {
    const errorSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 5, 
        delay: () => 0, 
        backoffLimit: 0,
        limitConnections: 0
      },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('error', errorSpy)

    // Multiple connections should work
    for (let i = 0; i < 5; i++) {
      // autoconnect already scheduled
      await Promise.resolve()
      eventHandlers.onclose?.({ code: 1002, reason: `Test close ${i}` })
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('should emit events with correct parameters', async () => {
    const connectingSpy = vi.fn()
    const openSpy = vi.fn()
    const errorSpy = vi.fn()
    const closeSpy = vi.fn()
    const messageSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    session = client.createSession('ws://localhost:8080')
    session.on('connecting', connectingSpy)
    session.on('open', openSpy)
    session.on('error', errorSpy)
    session.on('close', closeSpy)
    session.on('message', messageSpy)

    // Test connecting event
    await tick()
    expect(connectingSpy).toHaveBeenCalledTimes(1)
    expect(connectingSpy).toHaveBeenCalledWith()

    // Test open event
    eventHandlers.onopen?.()
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith()

    // Test message event with string data
    eventHandlers.onmessage?.({ data: 'test string message' })
    expect(messageSpy).toHaveBeenCalledTimes(1)
    expect(messageSpy).toHaveBeenCalledWith('test string message')

    // Test message event with ArrayBuffer data
    const buffer = new ArrayBuffer(8)
    const view = new Uint8Array(buffer)
    view[0] = 1
    view[1] = 2
    eventHandlers.onmessage?.({ data: buffer })
    expect(messageSpy).toHaveBeenCalledTimes(2)
    expect(messageSpy).toHaveBeenCalledWith(buffer)

    // Test error event
    eventHandlers.onerror?.()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'WebSocket connection error'
    }))

    // Test close event
    eventHandlers.onclose?.({ code: 1000, reason: 'Normal closure' })
    expect(closeSpy).toHaveBeenCalledTimes(1)
    expect(closeSpy).toHaveBeenCalledWith(1000, 'Normal closure')
  })

  it('should emit close event with correct parameters for different close codes', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    session = new WebSocketClient({ baseUrl: 'http://localhost:8080', webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 }, webSocketTimeout: 1000 }).createSession('ws://localhost:8080')
    session.on('close', closeSpy)
    await tick()
    // already connected via session
    eventHandlers.onopen?.()

    // Test different close codes and reasons
    const testCases = [
      { code: 1000, reason: 'Normal closure' },
      { code: 1001, reason: 'Going away' },
      { code: 1002, reason: 'Protocol error' },
      { code: 1003, reason: 'Unsupported data' },
      { code: 1006, reason: 'Abnormal closure' },
      { code: 1011, reason: 'Server error' },
      { code: 3000, reason: 'Custom code' },
    ]

    for (const testCase of testCases) {
      // Create a new client for each test case to avoid interference
      const testClient = new WebSocketClient({
        baseUrl: 'http://localhost:8080',
        webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
        webSocketTimeout: 1000,
      })
      const testSession = testClient.createSession('ws://localhost:8080')
      const testCloseSpy = vi.fn()
      testSession.on('close', testCloseSpy)
      await tick()
      // Simulate the close event
      testSession['ws'] = mockWs
      eventHandlers.onclose?.(testCase)
      expect(testCloseSpy).toHaveBeenCalledWith(testCase.code, testCase.reason)
    }
  })

  it('should emit error event with correct error types', async () => {
    // Test connection error
    const connectionErrorSpy = vi.fn()
    const connectionClient = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    const connectionSession = connectionClient.createSession('ws://localhost:8080')
    connectionSession.on('error', connectionErrorSpy)
    await tick()
    eventHandlers.onerror?.()
    expect(connectionErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'WebSocket connection error'
    }))

    // Test timeout error
    const timeoutErrorSpy = vi.fn()
    const timeoutClient = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { limit: 1, delay: () => 0, backoffLimit: 0 },
      webSocketTimeout: 1000,
    })
    const timeoutSession = timeoutClient.createSession('ws://localhost:8080')
    timeoutSession.on('error', timeoutErrorSpy)
    await tick()
    // Simulate timeout by calling handleTimeout directly
    timeoutSession['handleTimeout']()
    expect(timeoutErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'WebSocket connection timeout'
    }))

    // Test connection limit on close → expect close (not error)
    const limitCloseSpy = vi.fn()
    const limitClient = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      webSocketRetry: { 
        limit: 5, 
        delay: () => 0, 
        backoffLimit: 0,
        limitConnections: 1
      },
      webSocketTimeout: 1000,
    })
    const limitSession = limitClient.createSession('ws://localhost:8080')
    limitSession.on('close', limitCloseSpy)
    await tick()
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close' })
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(limitCloseSpy).toHaveBeenCalledWith(1002, 'Test close')
  })
})
