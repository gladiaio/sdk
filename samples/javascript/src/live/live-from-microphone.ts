import { GladiaClient, type LiveV2InitRequest } from '@gladiaio/sdk'
import {
  getMicrophoneAudioFormat,
  initMicrophoneRecorder,
  printMessage,
  readGladiaKey,
} from './helpers.ts'

const config: LiveV2InitRequest = {
  language_config: {
    languages: ['es', 'ru', 'en', 'fr'],
    code_switching: true,
  },
  messages_config: {
    receive_partial_transcripts: true,
  },
}

async function start() {
  const gladia = new GladiaClient({
    apiKey: readGladiaKey(),
  })

  const startTime = Date.now()
  const liveSession = gladia.liveV2().newSession({
    ...getMicrophoneAudioFormat(),
    ...config,
  })
  liveSession
    .on('speech_start', (message) => printMessage(message, startTime))
    .on('speech_end', (message) => printMessage(message, startTime))
    .on('transcript', (transcript) => {
      printMessage(transcript, startTime)
    })

  const recorder = initMicrophoneRecorder(
    // Send every chunk from recorder to the socket
    (chunk) => liveSession.sendAudio(chunk),
    // When the recording is stopped, we send a message to tell the server
    // we are done sending audio and it can start the post-processing
    () => liveSession.stop()
  )

  recorder.start()
}

start()
