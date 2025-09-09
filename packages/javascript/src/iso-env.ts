export function getEnv(envVariableName: string, defaultValue: string): string
export function getEnv(envVariableName: string): string | undefined
export function getEnv(envVariableName: string, defaultValue?: string): string | undefined {
  if (typeof process === 'undefined' || typeof process.env === 'undefined') {
    return defaultValue
  }
  return process.env[envVariableName] ?? defaultValue
}
