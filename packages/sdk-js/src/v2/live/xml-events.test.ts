import { describe, expect, it } from 'vitest'
import { isXmlEvent, parseXmlEvent } from './xml-events.js'

function message(text: string, id = 'xml_3f9a1c2e_00000007') {
  return {
    type: 'transcript',
    session_id: '0199d7a2-5c3e-7b41-9f0a-3c2d1e4f5a6b',
    created_at: '2026-11-06T15:02:11.402Z',
    data: {
      id,
      is_final: true,
      utterance: {
        text,
        start: 3.84,
        end: 3.84,
        channel: 0,
        language: 'fr',
        confidence: 1,
        words: [],
      },
    },
  }
}

const EOT = '<end_of_turn channel="0" probability="0.97" reason="model" end="3.84"/>'

describe('parseXmlEvent', () => {
  it('reads an end_of_turn tag back', () => {
    expect(isXmlEvent(message(EOT))).toBe(true)
    expect(parseXmlEvent(message(EOT))).toEqual({
      tag: 'end_of_turn',
      attributes: { channel: '0', probability: '0.97', reason: 'model', end: '3.84' },
      children: [],
    })
  })

  it('reads text, children and escapes', () => {
    const event = parseXmlEvent(
      '<named_entities channel="0" start="1.02" end="3.84">' +
        '<entity entity_type="ORG" start="3.1" end="3.4">Tom &amp; Jerry &lt;3</entity></named_entities>'
    )
    expect(event?.tag).toBe('named_entities')
    expect(event?.children).toEqual([
      {
        tag: 'entity',
        attributes: { entity_type: 'ORG', start: '3.1', end: '3.4' },
        children: [],
        text: 'Tom & Jerry <3',
      },
    ])
  })

  it('reads an attribute with escaped quotes', () => {
    const event = parseXmlEvent('<speaker_identified speaker_name="O&apos;Neil &quot;Jr&quot;"/>')
    expect(event?.attributes.speaker_name).toBe('O\'Neil "Jr"')
  })

  it('gives the reason of a failed event', () => {
    const event = parseXmlEvent('<translation from="fr" to="en" error="translation timed out"/>')
    expect(event?.error).toBe('translation timed out')
  })

  it('returns undefined for speech, other messages and broken text', () => {
    const speech = message('Bonjour, je voudrais réserver une table.', '00_00000003')
    expect(isXmlEvent(speech)).toBe(false)
    expect(parseXmlEvent(speech)).toBeUndefined()
    expect(parseXmlEvent({ type: 'speech_start', data: { time: 1 } })).toBeUndefined()
    expect(parseXmlEvent('hello')).toBeUndefined()
    expect(parseXmlEvent('<broken')).toBeUndefined()
    expect(parseXmlEvent('<a></b>')).toBeUndefined()
    expect(parseXmlEvent('<a/><b/>')).toBeUndefined()
  })
})
