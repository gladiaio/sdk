import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GladiaClient } from './client.js'
import * as liveModule from './v2/live/index.js'
import { SDK_VERSION } from './version.js'

describe('GladiaClient', () => {
  const liveV2Spy = vi.spyOn(liveModule, 'LiveV2Client').mockImplementation(() => {
    return {} as unknown as InstanceType<typeof liveModule.LiveV2Client>
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('merges default headers and appends SDK version when providing user headers at construction', () => {
    const gladiaClient = new GladiaClient({ httpHeaders: { 'x-custom': 'abc' } })
    gladiaClient.liveV2()
    const calls = liveV2Spy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[calls.length - 1][0]
    expect(call.httpHeaders['x-custom']).toBe('abc')
    expect(call.httpHeaders['x-gladia-version']).toContain(`SdkJavascript/${SDK_VERSION}`)
  })

  it('appends SDK version to any provided X-GLADIA-VERSION value', () => {
    const gladiaClient = new GladiaClient({ httpHeaders: { 'X-GLADIA-VERSION': 'MyApp/1.2.3' } })
    gladiaClient.liveV2()
    const calls = liveV2Spy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const { httpHeaders } = calls[calls.length - 1][0]
    expect(httpHeaders['x-gladia-version']).toBe(`MyApp/1.2.3 SdkJavascript/${SDK_VERSION}`)
  })

  it('injects x-gladia-key when apiKey is set', () => {
    const gladiaClient = new GladiaClient({ apiKey: 'key-123' })
    gladiaClient.liveV2()
    const calls = liveV2Spy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const { httpHeaders } = calls[calls.length - 1][0]
    expect(httpHeaders['x-gladia-key']).toBe('key-123')
  })

  it('per-call options merge with client options and keep version appended', () => {
    const gladiaClient = new GladiaClient({ httpHeaders: { 'x-base': 'a' }, apiKey: 'abc' })
    gladiaClient.liveV2({ httpHeaders: { 'x-override': 'b' } })
    const calls = liveV2Spy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const { httpHeaders } = calls[calls.length - 1][0]
    expect(httpHeaders['x-base']).toBe('a')
    expect(httpHeaders['x-override']).toBe('b')
    expect(httpHeaders['x-gladia-key']).toBe('abc')
    expect(httpHeaders['x-gladia-version']).toContain(`SdkJavascript/${SDK_VERSION}`)
  })

  it('per-call options merge with gladia version', () => {
    const gladiaClient = new GladiaClient({
      httpHeaders: { 'x-gladia-version': 'GladiaClient/1.2.3' },
      apiKey: 'abc',
    })
    gladiaClient.liveV2({ httpHeaders: { 'x-gladia-version': 'LiveClient/4.5.6' } })
    const calls = liveV2Spy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const { httpHeaders } = calls[calls.length - 1][0]
    expect(httpHeaders['x-gladia-key']).toBe('abc')
    expect(httpHeaders['x-gladia-version']).toContain(
      `LiveClient/4.5.6 SdkJavascript/${SDK_VERSION}`
    )
  })
})
