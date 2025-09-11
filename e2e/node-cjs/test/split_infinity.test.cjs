const { GladiaClient } = require('@gladiaio/sdk')
const { test } = require('node:test')
const { parseAudioFile, sendAudioFile } = require('@gladiaio/sdk-e2e-javascript-fixtures')
const assert = require('node:assert')

test('split infinity', async () => {
  const audioFile = 'short_split_infinity_16k.wav'
  const gladiaClient = new GladiaClient()

  /** @type {(import('@gladiaio/sdk').LiveV2WebSocketMessage)[]} */
  const messages = await new Promise((resolve, reject) => {
    const audioData = parseAudioFile(audioFile)
    /** @type {(import('@gladiaio/sdk').LiveV2WebSocketMessage)[]} */
    const messages = []
    const liveSession = gladiaClient.liveV2().newSession({
      ...audioData.audioConfig,
      language_config: {
        languages: ['en'],
      },
      messages_config: {
        receive_final_transcripts: true,
        receive_lifecycle_events: true,

        receive_partial_transcripts: false,
        receive_acknowledgments: false,
        receive_speech_events: false,
        receive_pre_processing_events: false,
        receive_realtime_processing_events: false,
        receive_post_processing_events: false,
        receive_errors: false,
      },
    })
    liveSession.on('message', (message) => {
      console.log(JSON.stringify(message))
      messages.push(message)
    })
    liveSession.once('end_session', () => {
      liveSession.destroy()
      resolve(messages)
    })
    liveSession.once('error', (error) => {
      liveSession.destroy()
      reject(error)
    })

    sendAudioFile(audioData, liveSession, 50)
  })

  // TODO remove once we have integrated lifecycle events and we can remove the receive_lifecycle_events
  const transcripts = messages.filter((message) => message.type === 'transcript')
  for (const message of transcripts) {
    assert.equal(message.type, 'transcript')
    assert.equal(message.data.is_final, true)
  }
  assert.match(
    transcripts.map((message) => message.data.utterance.text).join(' '),
    /^\ssplit infinity\p{P}*$/iu
  )
})
