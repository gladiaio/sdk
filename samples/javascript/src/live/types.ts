import type { LiveV2InitRequest } from '@gladiaio/sdk'

export type Recorder = {
  start(): void
  stop(): void
}

export type StreamingAudioFormat = Required<
  Pick<LiveV2InitRequest, 'bit_depth' | 'channels' | 'encoding' | 'sample_rate'>
>
