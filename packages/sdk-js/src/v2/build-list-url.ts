/**
 * Build a list endpoint URL from a collection path and optional list params.
 *
 * When `params.url` is set, that absolute pagination URL is returned as-is and
 * other filters are ignored.
 */

export type ListUrlParams = {
  offset?: number
  limit?: number
  date?: string
  before_date?: string
  after_date?: string
  status?: string[]
  custom_metadata?: Record<string, unknown>
  url?: string
}

export function buildListUrl(basePath: string, params?: ListUrlParams | null): string {
  if (!params) {
    return basePath
  }

  if (params.url) {
    return params.url
  }

  const search = new URLSearchParams()

  if (params.offset !== undefined && params.offset !== null) {
    search.append('offset', String(params.offset))
  }
  if (params.limit !== undefined && params.limit !== null) {
    search.append('limit', String(params.limit))
  }
  if (params.date) {
    search.append('date', params.date)
  }
  if (params.before_date) {
    search.append('before_date', params.before_date)
  }
  if (params.after_date) {
    search.append('after_date', params.after_date)
  }
  if (params.status) {
    for (const status of params.status) {
      search.append('status', status)
    }
  }
  if (params.custom_metadata) {
    for (const [key, value] of Object.entries(params.custom_metadata)) {
      if (value === undefined || value === null) {
        continue
      }
      search.append(`custom_metadata[${key}]`, String(value))
    }
  }

  const query = search.toString()
  return query ? `${basePath}?${query}` : basePath
}
