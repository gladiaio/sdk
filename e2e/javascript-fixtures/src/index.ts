import type { LiveV2InitRequest, LiveV2Session } from '@gladiaio/sdk'
import { readFileSync } from 'fs'
import path from 'path'

type LiveV2InitRequestAudioConfig = Required<
  Pick<LiveV2InitRequest, 'bit_depth' | 'channels' | 'encoding' | 'sample_rate'>
>

export function getRootFolder() {
  return path.join(
    typeof __dirname !== 'undefined' ? __dirname : new URL('.', import.meta.url).pathname,
    '..',
    '..',
    '..'
  )
}

export function getDataFolder() {
  return path.join(getRootFolder(), 'data')
}

export function getDataFile(filename: string) {
  return path.join(getDataFolder(), filename)
}

export function parseAudioFile(filename: string): {
  startDataChunk: number
  buffer: Buffer
  audioConfig: LiveV2InitRequestAudioConfig
} {
  const textDecoder = new TextDecoder()
  const buffer = readFileSync(getDataFile(filename))
  if (
    textDecoder.decode(buffer.subarray(0, 4)) !== 'RIFF' ||
    textDecoder.decode(buffer.subarray(8, 12)) !== 'WAVE' ||
    textDecoder.decode(buffer.subarray(12, 16)) !== 'fmt '
  ) {
    throw new Error('Unsupported file format')
  }

  const fmtSize = buffer.readUInt32LE(16)
  let encoding: LiveV2InitRequestAudioConfig['encoding']
  const format = buffer.readUInt16LE(20)
  if (format === 1) {
    encoding = 'wav/pcm'
  } else if (format === 6) {
    encoding = 'wav/alaw'
  } else if (format === 7) {
    encoding = 'wav/ulaw'
  } else {
    throw new Error('Unsupported encoding')
  }
  const channels = buffer.readUInt16LE(22)
  const sample_rate = buffer.readUInt32LE(24) as LiveV2InitRequestAudioConfig['sample_rate']
  const bit_depth = buffer.readUInt16LE(34) as LiveV2InitRequestAudioConfig['bit_depth']

  let nextSubChunk = 16 + 4 + fmtSize
  while (textDecoder.decode(buffer.subarray(nextSubChunk, nextSubChunk + 4)) !== 'data') {
    nextSubChunk += 8 + buffer.readUInt32LE(nextSubChunk + 4)
  }

  return {
    audioConfig: {
      encoding,
      sample_rate,
      channels,
      bit_depth,
    },
    startDataChunk: nextSubChunk,
    buffer,
  }
}

export async function sendAudioFile(
  {
    startDataChunk,
    buffer,
    audioConfig: { bit_depth, sample_rate, channels },
  }: ReturnType<typeof parseAudioFile>,
  liveSession: LiveV2Session,
  chunkDuration = 50
) {
  const audioData = buffer.subarray(startDataChunk + 8, buffer.readUInt32LE(startDataChunk + 4))

  const bytesPerSample = bit_depth / 8
  const bytesPerSecond = sample_rate * channels * bytesPerSample
  const chunkSize = Math.round((chunkDuration / 1000) * bytesPerSecond)

  for (let i = 0; i < audioData.length; i += chunkSize) {
    liveSession.sendAudio(audioData.subarray(i, i + chunkSize))
    await new Promise((resolve) => setTimeout(resolve, chunkDuration))
  }
  liveSession.stop()
}
