import {
  GladiaClient,
  type LiveV2NamedEntityRecognitionMessage,
  type LiveV2NamedEntityRecognitionResult,
  type LiveV2TranscriptMessage,
} from '@gladiaio/sdk'
import { parseAudioFile, sendAudioFile } from '@gladiaio/sdk-e2e-javascript-fixtures'
import assert from 'node:assert'
import { test } from 'vitest'

test('split infinity', async () => {
  const audioFile = 'short_split_infinity_16k.wav'
  const audioData = parseAudioFile(audioFile)

  const transcripts: LiveV2TranscriptMessage[] = []
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

  const endPromise = new Promise<void>((resolve) => {
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

  const transcripts: LiveV2TranscriptMessage[] = []
  const nerMessages: LiveV2NamedEntityRecognitionMessage[] = []
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

  const endPromise = new Promise<void>((resolve) => {
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

  const rawResults: LiveV2NamedEntityRecognitionResult[] = []
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
