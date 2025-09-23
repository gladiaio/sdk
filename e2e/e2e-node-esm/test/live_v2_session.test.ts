import { GladiaClient, type LiveV2TranscriptMessage } from '@gladiaio/sdk'
import { parseAudioFile, sendAudioFile } from '@gladiaio/sdk-e2e-javascript-fixtures'
import assert from 'node:assert'
import { test } from 'node:test'

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
