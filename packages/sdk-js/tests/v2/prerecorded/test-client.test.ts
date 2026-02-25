/**
 * Tests for the high-level Gladia client (preRecordedV2 option merging).
 */

import { describe, expect, it, vi } from 'vitest'
import { GladiaClient } from '../../../src/client.js'
import { SDK_VERSION } from '../../../src/version.js'
import * as prerecordedModule from '../../../src/v2/prerecorded/index.js'

describe('GladiaClient preRecordedV2', () => {
  const preRecordedV2Spy = vi.spyOn(prerecordedModule, 'PreRecordedV2Client').mockImplementation((options: any) => ({
    options,
  }) as any)

  it('merges inline overrides and passes to PreRecordedV2Client', () => {
    const client = new GladiaClient({
      apiKey: 'base-key',
      apiUrl: 'https://api.example.com',
      region: 'eu-west',
      httpHeaders: { 'x-gladia-version': 'base' },
      httpTimeout: 5,
    })

    const merged = client.preRecordedV2({
      apiKey: 'override-key',
      apiUrl: 'https://pr.example.org',
      region: 'us-west',
      httpHeaders: { 'x-gladia-version': 'override', 'X-Custom': '1' },
      httpTimeout: 60,
    })

    expect(preRecordedV2Spy).toHaveBeenCalledTimes(1)
    const [options] = preRecordedV2Spy.mock.calls[0]
    expect(options).not.toBe(client)
    expect(options.apiKey).toBe('override-key')
    expect(options.apiUrl).toBe('https://pr.example.org')
    expect(options.region).toBe('us-west')
    expect(options.httpTimeout).toBe(60)
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
      httpTimeout: 120,
    }

    client.preRecordedV2(provided)

    const [options] = preRecordedV2Spy.mock.calls[preRecordedV2Spy.mock.calls.length - 1]
    expect(options.apiKey).toBe('provided-key')
    expect(options.apiUrl).toBe('https://alt.example.net')
    expect(options.region).toBe('us-west')
    expect(options.httpTimeout).toBe(120)
    expect(options.httpHeaders['x-gladia-key']).toBe('provided-key')
    expect(options.httpHeaders['x-gladia-version']).toContain(`SdkJavascript/${SDK_VERSION}`)
  })

  it('injects x-gladia-key when apiKey is set', () => {
    const client = new GladiaClient({ apiKey: 'key-123' })
    client.preRecordedV2()
    const [options] = preRecordedV2Spy.mock.calls[preRecordedV2Spy.mock.calls.length - 1]
    expect(options.httpHeaders['x-gladia-key']).toBe('key-123')
  })
})
