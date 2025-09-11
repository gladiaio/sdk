import type { Headers } from './types.js'

export function mergeHeaders(...headers: (Headers | undefined)[]): Record<string, string> {
  if (!headers.length) return {}

  return headers.reduce<Record<string, string>>((acc, cur) => {
    return { ...acc, ...cur }
  }, {})
}

export function getEnv<T extends string>(envVariableName: string, defaultValue: T): T
export function getEnv<T extends string>(envVariableName: string): T | undefined
export function getEnv<T extends string>(envVariableName: string, defaultValue?: T): T | undefined {
  if (typeof process === 'undefined' || typeof process.env === 'undefined') {
    return defaultValue
  }
  return (process.env[envVariableName] ?? defaultValue) as T | undefined
}
