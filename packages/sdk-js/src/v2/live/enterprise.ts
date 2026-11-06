/**
 * The live init options only the Gladia Enterprise API knows (`LiveV2EnterpriseInitOptions`).
 * Gladia's cloud API refuses an unknown field (`400 property finals should not exist`), so the
 * same code runs on both: towards the cloud (`api.gladia.io`) the SDK drops these fields, with one
 * warning per field; towards any other `apiUrl` (an Enterprise deployment, a proxy) it sends them
 * as they are.
 */

/** The top-level init fields the Gladia Enterprise API adds. */
export const ENTERPRISE_INIT_FIELDS = ['finals'] as const

const CLOUD_HOSTS = new Set(['api.gladia.io'])
const warned = new Set<string>()

/** Whether `apiUrl` is Gladia's cloud API. */
export function isGladiaCloud(apiUrl: string | URL): boolean {
  try {
    return CLOUD_HOSTS.has(new URL(apiUrl).hostname)
  } catch {
    return false
  }
}

/**
 * The init body for `apiUrl`: unchanged for an Enterprise deployment; without the Enterprise
 * fields for Gladia's cloud API, each dropped field warned once.
 */
export function initBodyFor<T extends Record<string, unknown>>(
  body: T,
  apiUrl: string | URL | undefined
): T {
  if (apiUrl === undefined || !isGladiaCloud(apiUrl)) return body
  const out: Record<string, unknown> = { ...body }
  for (const field of ENTERPRISE_INIT_FIELDS) {
    if (!(field in out)) continue
    delete out[field]
    if (!warned.has(field)) {
      warned.add(field)
      console.warn(
        `@gladiaio/sdk: "${field}" is a Gladia Enterprise option, not sent to Gladia's cloud API (apiUrl ${String(apiUrl)})`
      )
    }
  }
  return out as T
}

/** Test hook: forget which fields were warned about. */
export function resetEnterpriseWarnings(): void {
  warned.clear()
}
