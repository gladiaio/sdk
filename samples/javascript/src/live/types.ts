import type { Live } from '@gladiaio/sdk'

export type Recorder = {
  start(): void
  stop(): void
}

export type StreamingAudioFormat = Required<
  Pick<Live.StreamingRequest, 'bit_depth' | 'channels' | 'encoding' | 'sample_rate'>
>
