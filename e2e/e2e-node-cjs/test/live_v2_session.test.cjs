const { GladiaClient } = require('@gladiaio/sdk')
const { test } = require('node:test')
const { parseAudioFile, sendAudioFile } = require('@gladiaio/sdk-e2e-javascript-fixtures')
const assert = require('node:assert')

test('split infinity', async () => {
  const audioFile = 'short_split_infinity_16k.wav'
  const audioData = parseAudioFile(audioFile)

  /** @type {(import('@gladiaio/sdk').LiveV2TranscriptMessage)[]} */
  const transcripts = []
  const liveSession = new GladiaClient().liveV2().startSession({
    ...audioData.audioConfig,
    language_config: {
      languages: ['en'],
    },
  })
  assert.equal(liveSession.status, 'starting')

  liveSession.on('message', (message) => {
    console.log(JSON.stringify(message))
    if (message.type === 'transcript') {
      transcripts.push(message)
    }
  })
  liveSession.once('error', (error) => {
    console.error(error)
  })

  const endPromise = new Promise((resolve) => {
    liveSession.once('ended', () => {
      resolve()
    })
  })

  await sendAudioFile(audioData, liveSession, 50)
  liveSession.stopRecording()
  assert.equal(liveSession.status, 'ending')

  await endPromise
  assert.equal(liveSession.status, 'ended')

  for (const transcript of transcripts) {
    assert.equal(transcript.type, 'transcript')
    assert.equal(transcript.data.is_final, true)
  }
  assert.match(
    transcripts.map((transcript) => transcript.data.utterance.text).join(' '),
    /^\ssplit infinity\p{P}*$/iu
  )
})

test('named entity recognition: anna-and-sasha yields Sasha as NAME_GIVEN', async () => {
  const audioFile = 'anna-and-sasha-16000.wav'
  const audioData = parseAudioFile(audioFile)

  /** @type {(import('@gladiaio/sdk').LiveV2TranscriptMessage)[]} */
  const transcripts = []
  /** @type {(import('@gladiaio/sdk').LiveV2NamedEntityRecognitionMessage)[]} */
  const nerMessages = []
  const liveSession = new GladiaClient().liveV2().startSession({
    ...audioData.audioConfig,
    language_config: {
      languages: ['en'],
    },
    realtime_processing: {
      named_entity_recognition: true,
    },
    messages_config: {
      receive_final_transcripts: true,
      receive_realtime_processing_events: true,
    },
  })
  assert.equal(liveSession.status, 'starting')

  liveSession.on('message', (message) => {
    if (message.type === 'transcript') {
      transcripts.push(message)
    } else if (message.type === 'named_entity_recognition') {
      nerMessages.push(message)
    }
  })
  liveSession.once('error', (error) => {
    console.error(error)
  })

  const endPromise = new Promise((resolve) => {
    liveSession.once('ended', () => {
      resolve()
    })
  })

  await sendAudioFile(audioData, liveSession, 50)
  liveSession.stopRecording()
  assert.equal(liveSession.status, 'ending')

  await endPromise
  assert.equal(liveSession.status, 'ended')

  const full = transcripts
    .map((t) => t.data.utterance.text)
    .join(' ')
    .toLowerCase()
  assert(full.includes('sasha'), 'expected transcript to contain sasha')

  /** @type {import('@gladiaio/sdk').LiveV2NamedEntityRecognitionResult[]} */
  const rawResults = []
  for (const msg of nerMessages) {
    if (msg.data?.results) {
      rawResults.push(...msg.data.results)
    }
  }
  const sashaAsGiven = rawResults.filter(
    (r) => r.text.toLowerCase().includes('sasha') && r.entity_type.toUpperCase() === 'NAME_GIVEN'
  )
  assert(
    sashaAsGiven.length > 0,
    `expected NAME_GIVEN entity for Sasha, got ${JSON.stringify(rawResults.map((r) => [r.entity_type, r.text]))}`
  )
})
