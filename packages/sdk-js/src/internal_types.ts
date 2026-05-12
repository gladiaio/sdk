/**
 * Internal types for the Gladia Client.
 * Not to be exported to the public API.
 */

import type { Headers } from './network/types.js'
import type {
  GladiaClientOptions,
  HttpRetryOptions,
  LiveV2Timeouts,
  PreRecordedV2Timeouts,
  WebSocketRetryOptions,
} from './types.js'

type InternalHttpRetryOptions = Required<HttpRetryOptions>
type InternalWebSocketRetryOptions = Required<WebSocketRetryOptions>

type OptionalGladiaClientOptions = 'apiKey' | 'region'

export type InternalGladiaClientOptions = Pick<GladiaClientOptions, OptionalGladiaClientOptions> &
  Required<
    Omit<
      GladiaClientOptions,
      | OptionalGladiaClientOptions
      | 'httpHeaders'
      | 'httpRetry'
      | 'wsRetry'
      | 'prerecordedTimeouts'
      | 'liveTimeouts'
    >
  > & {
    httpHeaders: Headers
    httpRetry: InternalHttpRetryOptions
    wsRetry: InternalWebSocketRetryOptions
    prerecordedTimeouts: Required<PreRecordedV2Timeouts>
    liveTimeouts: Required<LiveV2Timeouts>
  }
