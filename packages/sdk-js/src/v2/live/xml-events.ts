/**
 * Live events sent as XML tags in the transcript (Gladia Enterprise `xml_events` option).
 *
 * With `xml_events: true` in the session's init, every live event but the transcripts (speech
 * start and end, end of turn, translation, entities, sentiment, errors...) arrives as a final
 * `transcript` message whose `utterance.text` is one short XML tag, and whose id starts with
 * `xml_`:
 *
 *   <end_of_turn channel="0" probability="0.97" reason="model" end="3.84"/>
 *
 * ```ts
 * session.on('message', (message) => {
 *   const event = parseXmlEvent(message)
 *   if (event) console.log(event.tag, event.attributes)
 *   else if (message.type === 'transcript' && message.data.is_final) console.log(message.data.utterance.text)
 * })
 * ```
 */

export const XML_EVENT_ID_PREFIX = 'xml_'

/** One event read from its tag: `tag` is the event (`end_of_turn`, `translation`...),
 * `attributes` its kept keys (strings, as in the tag), `text` its main text (a translation, an
 * entity), `children` the nested tags (the entities of `named_entities`), `error` the reason
 * when the event failed. */
export interface LiveV2XmlEvent {
  tag: string
  attributes: Record<string, string>
  text?: string
  children: LiveV2XmlEvent[]
  error?: string
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

function unescape(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-z]+);/g, (whole, name: string) => {
    if (name.startsWith('#x')) return String.fromCodePoint(Number.parseInt(name.slice(2), 16))
    if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10))
    return ENTITIES[name] ?? whole
  })
}

const NAME = /[A-Za-z_][\w.-]*/y
const ATTRIBUTE = /\s+([A-Za-z_][\w.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/y
const SPACE = /\s*/y

class Reader {
  pos = 0
  constructor(readonly text: string) {}

  match(re: RegExp): RegExpExecArray | null {
    re.lastIndex = this.pos
    const found = re.exec(this.text)
    if (found) this.pos = re.lastIndex
    return found
  }

  take(literal: string): boolean {
    if (!this.text.startsWith(literal, this.pos)) return false
    this.pos += literal.length
    return true
  }

  element(): LiveV2XmlEvent {
    if (!this.take('<')) throw new Error('expected <')
    const name = this.match(NAME)
    if (!name) throw new Error('expected a tag name')
    const tag = name[0]
    const attributes: Record<string, string> = {}
    for (let attr = this.match(ATTRIBUTE); attr; attr = this.match(ATTRIBUTE)) {
      attributes[attr[1]] = unescape(attr[2] ?? attr[3] ?? '')
    }
    this.match(SPACE)
    const event: LiveV2XmlEvent = { tag, attributes, children: [] }
    if (attributes.error !== undefined) event.error = attributes.error
    if (this.take('/>')) return event
    if (!this.take('>')) throw new Error('expected >')
    let text = ''
    while (!this.take(`</${tag}>`)) {
      if (this.pos >= this.text.length) throw new Error(`unclosed <${tag}>`)
      if (this.text.startsWith('<', this.pos)) {
        event.children.push(this.element())
      } else {
        const next = this.text.indexOf('<', this.pos)
        const end = next === -1 ? this.text.length : next
        text += this.text.slice(this.pos, end)
        this.pos = end
      }
    }
    if (text) event.text = unescape(text)
    return event
  }
}

interface TranscriptLike {
  type?: unknown
  data?: { id?: unknown; utterance?: { text?: unknown } }
}

function textOf(message: unknown): string | undefined {
  const m = message as TranscriptLike | null
  if (!m || m.type !== 'transcript') return undefined
  const id = m.data?.id
  if (typeof id !== 'string' || !id.startsWith(XML_EVENT_ID_PREFIX)) return undefined
  const text = m.data?.utterance?.text
  return typeof text === 'string' ? text : undefined
}

/** True for a transcript message that carries an event as an XML tag. */
export function isXmlEvent(message: unknown): boolean {
  return textOf(message) !== undefined
}

/** The event of an XML event message, or of a tag's text; undefined for anything else (a
 * transcript of speech, another message, text that is not one XML element). */
export function parseXmlEvent(messageOrText: unknown): LiveV2XmlEvent | undefined {
  const text = typeof messageOrText === 'string' ? messageOrText : textOf(messageOrText)
  if (text === undefined) return undefined
  const reader = new Reader(text.trim())
  try {
    const event = reader.element()
    return reader.pos === reader.text.length ? event : undefined
  } catch {
    return undefined
  }
}
