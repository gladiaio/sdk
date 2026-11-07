import type { OpenAPIObject } from './types.ts'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * The schema drives code generation, so only fetch it over HTTPS.
 * Plain HTTP is accepted for a local API (loopback host) only.
 */
export function assertAllowedSchemaUrl(url: string): void {
  const { protocol, hostname } = new URL(url)
  if (protocol === 'https:') {
    return
  }
  if (protocol === 'http:' && LOOPBACK_HOSTS.has(hostname)) {
    return
  }
  throw new Error(`Refusing to fetch the OpenAPI schema from ${protocol}//${hostname}: use https`)
}

export async function fetchSchema(url: string): Promise<OpenAPIObject> {
  try {
    assertAllowedSchemaUrl(url)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected JSON content type, got: ${contentType}`)
    }

    const schema = (await response.json()) as OpenAPIObject

    // Basic validation
    if (!schema.openapi) {
      throw new Error('Invalid OpenAPI schema: missing openapi field')
    }

    if (!schema.paths) {
      throw new Error('Invalid OpenAPI schema: missing paths field')
    }

    return schema
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Schema fetch failed: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching schema')
  }
}
