import { GladiaClient, type LiveV2InitRequest } from '@gladiaio/sdk'
import { getAudioFileFormat, initFileRecorder, printMessage, readGladiaKey } from './helpers.ts'

const filename = 'anna-and-sasha-16000.wav'
const config: LiveV2InitRequest = {
  language_config: {
    languages: ['es', 'ru', 'en', 'fr'],
    code_switching: true,
  },
  messages_config: {
    receive_acknowledgments: true,
    receive_errors: true,
    receive_final_transcripts: true,
    receive_lifecycle_events: true,
    receive_partial_transcripts: true,
    receive_post_processing_events: true,
    receive_pre_processing_events: true,
    receive_realtime_processing_events: true,
    receive_speech_events: true,
  },
}

async function start() {
  const gladia = new GladiaClient({
    apiKey: readGladiaKey(),
  })

  const startTime = Date.now()
  const liveSession = gladia.liveV2().newSession({
    ...getAudioFileFormat(filename),
    ...config,
  })
  liveSession
    .on('start_session', (session) => {
      console.log(`Session ${session.session_id} started in ${Date.now() - startTime}ms.`)
    })
    .on('start_recording', (session) => {
      console.log(`Recording ${session.session_id} started in ${Date.now() - startTime}ms.`)
    })
    .on('transcript', (transcript) => {
      printMessage(transcript, startTime)
    })

  const recorder = initFileRecorder(
    // Send every chunk from recorder to the socket
    (chunk) => liveSession.sendAudio(chunk),
    // When the recording is stopped, we send a message to tell the server
    // we are done sending audio and it can start the post-processing
    () => liveSession.stop(),
    filename
  )

  recorder.start()
}

start()
