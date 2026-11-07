import { describe, expect, it } from 'vitest'
import { assertAllowedSchemaUrl, fetchSchema } from './schema-fetcher.ts'

describe('assertAllowedSchemaUrl', () => {
  it.each([
    'https://api.gladia.io/openapi.json',
    'http://localhost:8000/openapi.json',
    'http://127.0.0.1:8000/openapi.json',
    'http://[::1]:8000/openapi.json',
  ])('allows %s', (url) => {
    expect(() => assertAllowedSchemaUrl(url)).not.toThrow()
  })

  it.each([
    'http://api.gladia.io/openapi.json',
    'file:///etc/passwd',
    'data:application/json,{}',
    'ftp://example.com/openapi.json',
  ])('refuses %s', (url) => {
    expect(() => assertAllowedSchemaUrl(url)).toThrow(/Refusing to fetch/)
  })

  it('is enforced by fetchSchema before any request', async () => {
    await expect(fetchSchema('file:///etc/passwd')).rejects.toThrow(/Refusing to fetch/)
  })
})
