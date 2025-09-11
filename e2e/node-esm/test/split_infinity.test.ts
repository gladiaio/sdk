import { GladiaClient, type LiveV2TranscriptMessage } from '@gladiaio/sdk'
import { parseAudioFile, sendAudioFile } from '@gladiaio/sdk-e2e-javascript-fixtures'
import assert from 'node:assert'
import { test } from 'node:test'

test('split infinity', async () => {
  const audioFile = 'short_split_infinity_16k.wav'
  const gladiaClient = new GladiaClient()

  const transcripts = await new Promise<LiveV2TranscriptMessage[]>((resolve, reject) => {
    const audioData = parseAudioFile(audioFile)
    const transcripts: LiveV2TranscriptMessage[] = []
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
