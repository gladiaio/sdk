import { describe, expect, it } from 'vitest'
import { buildListUrl } from './build-list-url.js'

describe('buildListUrl', () => {
  it('returns the collection path when params are omitted', () => {
    expect(buildListUrl('/v2/pre-recorded')).toBe('/v2/pre-recorded')
    expect(buildListUrl('/v2/live', undefined)).toBe('/v2/live')
  })

  it('returns absolute url unchanged when url is set', () => {
    const next = 'https://api.gladia.io/v2/pre-recorded?status=done&offset=20&limit=20'
    expect(
      buildListUrl('/v2/pre-recorded', {
        url: next,
        offset: 0,
        limit: 5,
        status: ['error'],
      })
    ).toBe(next)
  })

  it('serializes scalar filters', () => {
    const url = buildListUrl('/v2/live', {
      offset: 10,
      limit: 5,
      date: '2026-09-10',
      before_date: '2026-09-10T10:38:56.452Z',
      after_date: '2026-09-01T00:00:00.000Z',
    })
    const parsed = new URL(url, 'https://api.gladia.io')
    expect(parsed.pathname).toBe('/v2/live')
    expect(parsed.searchParams.get('offset')).toBe('10')
    expect(parsed.searchParams.get('limit')).toBe('5')
    expect(parsed.searchParams.get('date')).toBe('2026-09-10')
    expect(parsed.searchParams.get('before_date')).toBe('2026-09-10T10:38:56.452Z')
    expect(parsed.searchParams.get('after_date')).toBe('2026-09-01T00:00:00.000Z')
  })

  it('serializes status as repeated keys', () => {
    const url = buildListUrl('/v2/pre-recorded', {
      status: ['done', 'error'],
    })
    expect(url).toContain('status=done')
    expect(url).toContain('status=error')
    const matches = url.match(/status=/g)
    expect(matches?.length).toBe(2)
  })

  it('serializes custom_metadata with bracket keys', () => {
    const url = buildListUrl('/v2/pre-recorded', {
      custom_metadata: { user: 'John Doe', env: 'prod' },
    })
    const parsed = new URL(url, 'https://api.gladia.io')
    expect(parsed.searchParams.get('custom_metadata[user]')).toBe('John Doe')
    expect(parsed.searchParams.get('custom_metadata[env]')).toBe('prod')
  })

  it('omits undefined and null filter values', () => {
    const url = buildListUrl('/v2/live', {
      offset: 0,
      limit: undefined,
      date: undefined,
      status: undefined,
      custom_metadata: undefined,
    })
    expect(url).toBe('/v2/live?offset=0')
  })
})
