import { describe, expect, it } from 'vitest'
import { applyGoInitialisms } from './go.ts'

describe('applyGoInitialisms', () => {
  it.each([
    ['Id', 'ID'],
    ['Url', 'URL'],
    ['UtteranceId', 'UtteranceID'],
    ['AudioUrl', 'AudioURL'],
    ['RequestId', 'RequestID'],
    ['HttpMethod', 'HTTPMethod'],
    ['ApiKey', 'APIKey'],
  ])('%s -> %s', (input, expected) => {
    expect(applyGoInitialisms(input)).toBe(expected)
  })

  it.each(['Identifier', 'Idle', 'Urls', 'Apis', 'Ideal', 'Width'])(
    'leaves %s unchanged',
    (input) => {
      expect(applyGoInitialisms(input)).toBe(input)
    }
  )
})
