import type { GladiaClientOptions, HttpRetryOptions, WebSocketRetryOptions } from '../../types.js'

export type LiveV2ClientOptions = Pick<GladiaClientOptions, 'apiKey' | 'region'> &
  Required<Omit<GladiaClientOptions, 'apiKey' | 'region'>> & {
    httpRetry: Required<HttpRetryOptions>
    webSocketRetry: Required<WebSocketRetryOptions>
  }

export type LiveV2SessionStatus =
  | 'starting'
  | 'started'
  | 'connecting'
  | 'connected'
  | 'ending'
  | 'ended'
