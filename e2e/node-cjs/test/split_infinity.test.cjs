const { GladiaClient } = require('@gladiaio/sdk')
const { test } = require('node:test')
const { parseAudioFile, sendAudioFile } = require('@gladiaio/sdk-e2e-javascript-fixtures')
const assert = require('node:assert')

test('split infinity', async () => {
  const audioFile = 'short_split_infinity_16k.wav'
  const gladiaClient = new GladiaClient()

  /** @type {(import('@gladiaio/sdk').LiveV2TranscriptMessage)[]} */
  const transcripts = await new Promise((resolve, reject) => {
    const audioData = parseAudioFile(audioFile)
    /** @type {(import('@gladiaio/sdk').LiveV2TranscriptMessage)[]} */
    const transcripts = []
    const liveSession = gladiaClient.liveV2().startSession({
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
      reject(error)
    })
    liveSession.once('ended', () => {
      try {
        assert.equal(liveSession.status, 'ended')
      } catch (error) {
        reject(error)
        return
      }

      resolve(transcripts)
    })

    sendAudioFile(audioData, liveSession, 50)
      .then(() => {
        liveSession.stopRecording()
        assert.equal(liveSession.status, 'ending')
      })
      .catch(reject)
  })

  for (const transcript of transcripts) {
    assert.equal(transcript.type, 'transcript')
    assert.equal(transcript.data.is_final, true)
  }
  assert.match(
    transcripts.map((transcript) => transcript.data.utterance.text).join(' '),
    /^\ssplit infinity\p{P}*$/iu
  )
})
