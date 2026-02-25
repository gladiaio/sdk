/**
 * Tests for the high-level Gladia client (liveV2 option merging).
 */

import { describe, expect, it, vi } from 'vitest'
import { GladiaClient } from '../../../src/client.js'
import { SDK_VERSION } from '../../../src/version.js'
import * as liveModule from '../../../src/v2/live/index.js'

describe('GladiaClient liveV2', () => {
  const liveV2Spy = vi.spyOn(liveModule, 'LiveV2Client').mockImplementation((options: any) => ({
    options,
  }) as any)

  it('merges inline overrides and passes to LiveV2Client', () => {
    const client = new GladiaClient({
      apiKey: 'base-key',
      apiUrl: 'https://api.example.com',
      region: 'eu-west',
      httpHeaders: { 'x-gladia-version': 'base' },
      httpTimeout: 5,
      wsTimeout: 7,
    })

    client.liveV2({
      apiKey: 'override-key',
      apiUrl: 'https://live.example.org',
      region: 'us-west',
      httpHeaders: { 'x-gladia-version': 'override', 'X-Custom': '1' },
      httpTimeout: 15,
      wsTimeout: 25,
    })

    expect(liveV2Spy).toHaveBeenCalledTimes(1)
    const [options] = liveV2Spy.mock.calls[0]
    expect(options.apiKey).toBe('override-key')
    expect(options.apiUrl).toBe('https://live.example.org')
    expect(options.region).toBe('us-west')
    expect(options.httpTimeout).toBe(15)
    expect(options.wsTimeout).toBe(25)
    expect(options.httpHeaders['x-gladia-key']).toBe('override-key')
    expect(options.httpHeaders['x-gladia-version']).toContain(`SdkJavascript/${SDK_VERSION}`)
    expect(options.httpHeaders['X-Custom']).toBe('1')
  })

  it('accepts prebuilt options object', () => {
    const client = new GladiaClient({ apiKey: 'base-key', apiUrl: 'https://api.example.com' })
    const provided = {
      apiKey: 'provided-key',
      apiUrl: 'https://alt.example.net',
      region: 'us-west',
      httpHeaders: { 'x-gladia-version': 'provided' },
      httpTimeout: 12,
      wsTimeout: 4,
    }

    client.liveV2(provided)

    const [options] = liveV2Spy.mock.calls[liveV2Spy.mock.calls.length - 1]
    expect(options.apiKey).toBe('provided-key')
    expect(options.apiUrl).toBe('https://alt.example.net')
    expect(options.region).toBe('us-west')
    expect(options.httpTimeout).toBe(12)
    expect(options.wsTimeout).toBe(4)
    expect(options.httpHeaders['x-gladia-key']).toBe('provided-key')
    expect(options.httpHeaders['x-gladia-version']).toContain(`SdkJavascript/${SDK_VERSION}`)
  })
})
