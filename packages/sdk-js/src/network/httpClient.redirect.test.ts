import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { GladiaClient } from '../client.js'
import { HttpClient } from './httpClient.js'

/**
 * x-gladia-key must not be forwarded on cross-origin redirects.
 * Production trigger: GET /v2/.../file → 302 to signed object storage.
 */

type CapturedRequest = {
  url: string
  headers: http.IncomingHttpHeaders
}

async function listen(server: http.Server): Promise<AddressInfo> {
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Expected AddressInfo from server.address()'))
        return
      }
      resolve(address)
    })
  })
}

async function close(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
}

describe('HttpClient cross-origin redirect credentials (SEC-386)', () => {
  const servers: http.Server[] = []
  const secretKey = 'DUMMY-KEY-REDIRECT-LEAK-TEST'

  afterEach(async () => {
    while (servers.length > 0) {
      const server = servers.pop()
      if (server) await close(server)
    }
  })

  async function startRedirectPair() {
    const captured: CapturedRequest[] = []
    const originCaptured: CapturedRequest[] = []

    const sink = http.createServer((req, res) => {
      captured.push({ url: req.url ?? '', headers: req.headers })
      res.writeHead(200, { 'content-type': 'application/octet-stream' })
      res.end('file-bytes')
    })
    servers.push(sink)
    const sinkAddr = await listen(sink)
    const sinkOrigin = `http://127.0.0.1:${sinkAddr.port}`

    const origin = http.createServer((req, res) => {
      originCaptured.push({ url: req.url ?? '', headers: req.headers })
      res.writeHead(302, { Location: `${sinkOrigin}/collect${req.url ?? ''}` })
      res.end()
    })
    servers.push(origin)
    const originAddr = await listen(origin)
    const originBase = `http://127.0.0.1:${originAddr.port}`

    return { captured, originCaptured, originBase, sinkOrigin }
  }

  it('does not forward x-gladia-key when HttpClient follows a cross-origin redirect', async () => {
    const { captured, originCaptured, originBase } = await startRedirectPair()

    const client = new HttpClient({
      baseUrl: originBase,
      headers: {
        'x-gladia-key': secretKey,
        'x-gladia-version': 'SdkJavascript/test',
      },
      retry: { maxAttempts: 1, statusCodes: [], delay: () => 0 },
      timeout: 5_000,
    })

    const response = await client.get('/v2/pre-recorded/job-id/file', { rawResponse: true })
    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('file-bytes')

    expect(captured).toHaveLength(1)
    expect(originCaptured[0]?.headers['x-gladia-key']).toBe(secretKey)
    expect(captured[0]?.headers['x-gladia-key']).toBeUndefined()
    expect(captured[0]?.headers['x-gladia-version']).toBe('SdkJavascript/test')
  })

  it('does not forward x-gladia-key when preRecorded.getFile follows a cross-origin redirect', async () => {
    const { captured, originBase } = await startRedirectPair()

    const gladia = new GladiaClient({
      apiKey: secretKey,
      apiUrl: originBase,
      httpRetry: { maxAttempts: 1, statusCodes: [], delay: () => 0 },
      httpTimeout: 5_000,
      prerecordedTimeouts: { getFile: 5_000 },
    })

    const bytes = await gladia.preRecorded().getFile('job-id')
    expect(Buffer.from(bytes).toString()).toBe('file-bytes')

    expect(captured).toHaveLength(1)
    expect(captured[0]?.headers['x-gladia-key']).toBeUndefined()
  })

  it('does not forward x-gladia-key when live.getFile follows a cross-origin redirect', async () => {
    const { captured, originBase } = await startRedirectPair()

    const gladia = new GladiaClient({
      apiKey: secretKey,
      apiUrl: originBase,
      httpRetry: { maxAttempts: 1, statusCodes: [], delay: () => 0 },
      httpTimeout: 5_000,
      liveTimeouts: { getFile: 5_000 },
    })

    const bytes = await gladia.live().getFile('job-id')
    expect(Buffer.from(bytes).toString()).toBe('file-bytes')

    expect(captured).toHaveLength(1)
    expect(captured[0]?.headers['x-gladia-key']).toBeUndefined()
  })
})
