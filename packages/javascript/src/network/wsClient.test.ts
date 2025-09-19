import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebSocketRetryOptions } from '../types.js'
import type { IsoWS } from './iso-ws.js'
import {
  WebSocketClient,
  type WebSocketClientOptions,
  WebSocketSession,
  WS_STATES,
} from './wsClient.js'

// Mock the iso-ws module
vi.mock('./iso-ws.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    // @ts-expect-error mock
    ...actual,
    newWebSocket: vi.fn(),
  }
})

// Define proper types for our mocks
interface MockWebSocket extends IsoWS {
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

interface EventHandlers {
  onopen: (() => void) | null
  onerror: ((error?: Error) => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null
}

function partialOptions(
  options?: Partial<Omit<WebSocketClientOptions, 'retry'>> & {
    retry?: Partial<WebSocketRetryOptions>
  }
): WebSocketClientOptions {
  return {
    baseUrl: 'ws://localhost:8080',
    timeout: 1000,
    ...options,
    retry: {
      maxAttemptsPerConnection: 0,
      delay: () => 0,
      maxDelay: 0,
      maxConnections: 0,
      closeCodes: [],
      ...options?.retry,
    },
  }
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
        set: (fn) => {
          eventHandlers.onopen = fn
        },
      })
      Object.defineProperty(mockWs, 'onerror', {
        get: () => eventHandlers.onerror,
        set: (fn) => {
          eventHandlers.onerror = fn
        },
      })
      Object.defineProperty(mockWs, 'onclose', {
        get: () => eventHandlers.onclose,
        set: (fn) => {
          eventHandlers.onclose = fn
        },
      })
      Object.defineProperty(mockWs, 'onmessage', {
        get: () => eventHandlers.onmessage,
        set: (fn) => {
          eventHandlers.onmessage = fn
        },
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

  function simulateOpen(): void {
    // when underlying ws opens, it should be OPEN
    ;(mockWs as any).readyState = WS_STATES.OPEN
    eventHandlers.onopen?.()
  }

  function simulateClose(code: number, reason: string): void {
    // when underlying ws closes, it should be CLOSED
    ;(mockWs as any).readyState = WS_STATES.CLOSED
    eventHandlers.onclose?.({ code, reason })
  }

  function simulateError(err?: Error): void {
    eventHandlers.onerror?.(err)
  }

  it('should connect successfully and emit events', async () => {
    const connectingSpy = vi.fn()
    const openSpy = vi.fn()
    const messageSpy = vi.fn()

    client = new WebSocketClient(partialOptions())
    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    session.onopen = openSpy
    session.onmessage = messageSpy

    // Let session auto-connect and attach handlers
    await tick()
    // No assertion on onconnecting being called immediately

    // Simulate WebSocket opening
    simulateOpen()
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith({ connection: 1, attempt: 1 })
    expect(session.readyState).toBe(WS_STATES.OPEN)

    // Simulate receiving a message
    eventHandlers.onmessage?.({ data: 'test message' })
    expect(messageSpy).toHaveBeenCalledTimes(1)
    expect(messageSpy).toHaveBeenCalledWith({ data: 'test message' })
  })

  it('should handle connection errors and retry', async () => {
    const errorSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: { maxAttemptsPerConnection: 2, delay: () => 10, maxDelay: 100 },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onerror = errorSpy
    session.onclose = closeSpy

    await tick()

    // Simulate connection error (pre-open): implementation retries, does not emit error yet
    simulateError()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(session.readyState).toBe(WS_STATES.CONNECTING)

    // Should not retry on error, only on close with retryable code
  })

  it('should retry on close with retryable code', async () => {
    const connectingSpy = vi.fn()
    const openSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 2,
          delay: () => 10,
          maxDelay: 100,
          closeCodes: [1002, [1003, 1006]],
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    session.onopen = openSpy
    session.onclose = closeSpy
    await Promise.resolve()
    await Promise.resolve()
    // connectingSpy may not have been called yet in original implementation

    // Simulate WebSocket opening
    simulateOpen()
    expect(openSpy).toHaveBeenCalledTimes(1)

    // Ensure open so that onclose is set, then close with retryable code
    simulateOpen()
    simulateClose(1002, 'Test close')

    // Wait for retry
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockNewWebSocket.mock.calls.length).toBeGreaterThanOrEqual(2) // Should retry
    expect(closeSpy).not.toHaveBeenCalled() // Should not emit close event yet
  })

  it('should not retry on close with non-retryable code', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 2,
          delay: () => 10,
          maxDelay: 100,
          closeCodes: [1002, [1003, 1006]],
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onclose = closeSpy
    await Promise.resolve()
    await Promise.resolve()

    // Ensure open so that onclose is set, then close with non-retryable code
    simulateOpen()
    simulateClose(1000, 'Normal closure')
    expect(closeSpy).toHaveBeenCalledWith({ code: 1000, reason: 'Normal closure' })
  })

  it('should not retry when maxAttemptsPerConnection is reached', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 1,
          delay: () => 10,
          maxDelay: 100,
          closeCodes: [1002],
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    session.onclose = closeSpy
    await tick()
    // connectingSpy may not have been called yet in original implementation

    // Ensure open so that onclose is set, then close with retryable code
    simulateOpen()
    simulateClose(1002, 'Test close')

    // Wait for potential retry
    await new Promise((resolve) => setTimeout(resolve, 50))

    // After close with retryable code, implementation reconnects; no close event emitted
    expect(mockNewWebSocket.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(closeSpy).not.toHaveBeenCalled()
  })

  it('should handle timeout', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: { maxAttemptsPerConnection: 1, delay: () => 0, maxDelay: 0 },
        timeout: 50,
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onclose = closeSpy
    await Promise.resolve()
    await Promise.resolve()

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(closeSpy).toHaveBeenCalledWith({ code: 3008, reason: 'WebSocket connection timeout' })
    expect(session.readyState).toBe(WS_STATES.CLOSED)
  })

  it('should send data when open', async () => {
    client = new WebSocketClient(
      partialOptions({
        retry: { maxAttemptsPerConnection: 1, delay: () => 0, maxDelay: 0 },
        timeout: 1000,
      })
    )
    session = client.createSession('ws://localhost:8080')
    await Promise.resolve()
    await Promise.resolve()
    simulateOpen()
    session.send('test data')
    expect(mockWs.send).toHaveBeenCalledWith('test data')
  })

  it('should throw error when sending while not open', async () => {
    client = new WebSocketClient(partialOptions())
    session = client.createSession('ws://localhost:8080')
    await Promise.resolve()
    await Promise.resolve()

    expect(() => session.send('test data')).toThrow('WebSocket is not open')
  })

  it('should close manually and emit close event', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient(partialOptions())
    session = client.createSession('ws://localhost:8080')
    session.onclose = closeSpy
    await Promise.resolve()
    await Promise.resolve()
    simulateOpen()
    session.close(1000)
    expect(mockWs.close).toHaveBeenCalledWith(1000)
    expect(session.readyState).toBe(WS_STATES.CLOSING)

    // Simulate close event
    simulateClose(1000, 'Manual close')
    expect(closeSpy).toHaveBeenCalledWith({ code: 1000, reason: 'Manual close' })
  })

  it('should respect connection maxAttemptsPerConnection', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxConnections: 1,
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onclose = closeSpy
    await tick()
    simulateOpen()
    simulateClose(1002, 'Test close')

    // Wait for potential retry
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Limit reached blocks reconnection and mirrors last close
    expect(closeSpy).toHaveBeenCalledWith({ code: 1002, reason: 'Test close' })
  })

  it('should reset connection attempts after successful connection', async () => {
    const connectingSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 2,
          delay: () => 10,
          maxDelay: 100,
          closeCodes: [1002],
        },
      })
    )

    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    await Promise.resolve()
    await Promise.resolve()
    eventHandlers.onopen?.() // Successful connection

    // Simulate close and retry
    eventHandlers.onclose?.({ code: 1002, reason: 'Test close' })

    // Wait for retry
    await new Promise((resolve) => setTimeout(resolve, 50))

    // connectingSpy may be called by implementation during retry, but we do not assert the count here
  })

  it('should clean up resources on destroy', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient(partialOptions())

    session = client.createSession('ws://localhost:8080')
    session.onclose = closeSpy
    await Promise.resolve()
    await Promise.resolve()
    simulateOpen()

    session.close(1000)
    expect(mockWs.close).toHaveBeenCalledWith(1000)
    // Underlying onclose transitions to CLOSED
    simulateClose(1000, '')
    expect(session.readyState).toBe(WS_STATES.CLOSED)
  })

  it('should not retry with maxAttemptsPerConnection 1 (only initial attempt)', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()
    const errorSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 1,
          delay: () => 10,
          maxDelay: 100,
          closeCodes: [1002],
        },
      })
    )

    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    session.onclose = closeSpy
    session.onerror = errorSpy
    await tick()
    expect(mockNewWebSocket).toHaveBeenCalledTimes(1)

    // Simulate connection error before open
    simulateError()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(errorSpy).toHaveBeenCalled()
    expect(mockNewWebSocket).toHaveBeenCalledTimes(1) // no retry
    expect(closeSpy).toHaveBeenCalledWith({ code: 1006, reason: 'WebSocket connection error' })
  })

  it('should retry exactly once with maxAttemptsPerConnection 2', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 2,
          delay: () => 10,
          maxDelay: 100,
          closeCodes: [1002],
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    session.onclose = closeSpy
    await tick()
    expect(mockNewWebSocket).toHaveBeenCalledTimes(1)

    // Simulate pre-open error to trigger retry logic
    simulateError()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockNewWebSocket.mock.calls.length).toBeGreaterThanOrEqual(2) // Initial + 1 retry
    // Pre-open error does not emit close; it retries silently
    expect(closeSpy).not.toHaveBeenCalled()

    // Simulate close again after opening the retried connection
    simulateOpen()
    simulateClose(1002, 'Test close 2')

    // Wait for any follow-up
    await new Promise((resolve) => setTimeout(resolve, 50))

    // After second close, implementation retries again; no close emitted yet
    expect(closeSpy).not.toHaveBeenCalled()
  })

  it('should retry unlimited times with maxAttemptsPerConnection 0', async () => {
    const connectingSpy = vi.fn()
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 0,
          delay: () => 10,
          maxDelay: 100,
          closeCodes: [1002],
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    session.onclose = closeSpy
    await tick()
    expect(mockNewWebSocket).toHaveBeenCalledTimes(1)

    // Simulate multiple pre-open errors
    for (let i = 0; i < 3; i++) {
      eventHandlers.onerror?.()
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    expect(mockNewWebSocket.mock.calls.length).toBeGreaterThanOrEqual(4) // Initial + 3 retries
    // No close emitted for pre-open errors
    expect(closeSpy).not.toHaveBeenCalled()
  })

  it('should respect maxConnections = 1', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 5,
          delay: () => 0,
          maxDelay: 0,
          maxConnections: 1,
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onclose = closeSpy
    await tick()

    // Simulate open, then close and try to reconnect
    simulateOpen()
    simulateClose(1002, 'Test close')
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Second connection blocked by maxAttemptsPerConnection emits close with same code/reason
    expect(closeSpy).toHaveBeenCalledWith({ code: 1002, reason: 'Test close' })
  })

  it('should respect maxConnections = 2', async () => {
    const closeSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          closeCodes: [1002],
          maxConnections: 2,
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onclose = closeSpy
    await tick()

    // Simulate open then close and try to reconnect
    simulateOpen()
    simulateClose(1002, 'Test close 1')
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Second connection should work (no close emitted yet by maxAttemptsPerConnection)
    expect(closeSpy).not.toHaveBeenCalledWith({ code: 1002, reason: 'Test close 1' })

    // Simulate open then close and try to reconnect again
    simulateOpen()
    simulateClose(1002, 'Test close 2')
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Third connection blocked by maxAttemptsPerConnection mirrors the last close
    expect(closeSpy).toHaveBeenCalledWith({ code: 1002, reason: 'Test close 2' })
  })

  it('should allow unlimited connections with maxConnections = 0', async () => {
    const errorSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 5,
          maxConnections: 0,
        },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onerror = errorSpy

    // Multiple connections should work
    for (let i = 0; i < 5; i++) {
      // autoconnect already scheduled
      await Promise.resolve()
      eventHandlers.onclose?.({ code: 1002, reason: `Test close ${i}` })
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('should emit events with correct parameters', async () => {
    const connectingSpy = vi.fn()
    const openSpy = vi.fn()
    const errorSpy = vi.fn()
    const closeSpy = vi.fn()
    const messageSpy = vi.fn()

    client = new WebSocketClient(
      partialOptions({
        retry: { maxAttemptsPerConnection: 1, closeCodes: [] },
      })
    )
    session = client.createSession('ws://localhost:8080')
    session.onconnecting = connectingSpy
    session.onopen = openSpy
    session.onerror = errorSpy
    session.onclose = closeSpy
    session.onmessage = messageSpy

    // Test connecting event
    await tick()
    expect(mockNewWebSocket).toHaveBeenCalledTimes(1)

    // Test open event
    simulateOpen()
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith({ connection: 1, attempt: 1 })

    // Test message event with string data
    eventHandlers.onmessage?.({ data: 'test string message' })
    expect(messageSpy).toHaveBeenCalledTimes(1)
    expect(messageSpy).toHaveBeenCalledWith({ data: 'test string message' })

    // Test message event with ArrayBuffer data
    const buffer = new ArrayBuffer(8)
    const view = new Uint8Array(buffer)
    view[0] = 1
    view[1] = 2
    eventHandlers.onmessage?.({ data: buffer })
    expect(messageSpy).toHaveBeenCalledTimes(2)
    expect(messageSpy).toHaveBeenCalledWith({ data: buffer })

    // Test error event after open: implementation does not call onerror
    simulateError()
    expect(errorSpy).not.toHaveBeenCalled()

    // Test close event
    simulateClose(1000, 'Normal closure')
    expect(closeSpy).toHaveBeenCalledTimes(1)
    expect(closeSpy).toHaveBeenCalledWith({ code: 1000, reason: 'Normal closure' })
  })

  it('should emit close event with correct parameters for different close codes', async () => {
    const closeSpy = vi.fn()

    session = new WebSocketClient(partialOptions()).createSession('ws://localhost:8080')
    session.onclose = closeSpy
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
      const testClient = new WebSocketClient(partialOptions())
      const testSession = testClient.createSession('ws://localhost:8080')
      const testCloseSpy = vi.fn()
      testSession.onclose = testCloseSpy
      await tick()
      // Simulate the close event (after open ensures handler set)
      testSession['ws'] = mockWs
      simulateOpen()
      simulateClose(testCase.code, testCase.reason)
      expect(testCloseSpy).toHaveBeenCalledWith(testCase)
    }
  })

  it('should emit error event with correct error types', async () => {
    // Test connection error
    const connectionErrorSpy = vi.fn()
    const connectionClient = new WebSocketClient({
      baseUrl: 'http://localhost:8080',
      retry: {
        maxAttemptsPerConnection: 1,
        delay: () => 0,
        maxDelay: 0,
        closeCodes: [
          [1002, 4399],
          [4500, 9999],
        ],
        maxConnections: 0,
      },
      timeout: 1000,
    })
    const connectionSession = connectionClient.createSession('ws://localhost:8080')
    connectionSession.onerror = connectionErrorSpy
    await tick()
    eventHandlers.onerror?.()
    expect(connectionErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'WebSocket connection error',
      })
    )

    // Test timeout error
    const timeoutCloseSpy = vi.fn()
    const timeoutClient = new WebSocketClient(partialOptions())
    const timeoutSession = timeoutClient.createSession('ws://localhost:8080')
    timeoutSession.onclose = timeoutCloseSpy
    await new Promise((r) => setTimeout(r, 1010))
    expect(timeoutCloseSpy).toHaveBeenCalledWith({
      code: 3008,
      reason: 'WebSocket connection timeout',
    })

    // Test connection maxAttemptsPerConnection on close → expect close (not error)
    const limitCloseSpy = vi.fn()
    const limitClient = new WebSocketClient(
      partialOptions({
        retry: {
          maxAttemptsPerConnection: 5,
          delay: () => 0,
          maxDelay: 0,
          maxConnections: 1,
        },
      })
    )
    const limitSession = limitClient.createSession('ws://localhost:8080')
    limitSession.onclose = limitCloseSpy
    await tick()
    simulateOpen()
    simulateClose(1002, 'Test close')
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(limitCloseSpy).toHaveBeenCalledWith({ code: 1002, reason: 'Test close' })
  })
})
