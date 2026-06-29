import type { LiveV2MessagesConfig } from './generated-types.js'

export type LiveV2SessionStatus =
  | 'starting'
  | 'started'
  | 'connecting'
  | 'connected'
  | 'ending'
  | 'ended'

export interface LiveV2ConnectSessionOptions {
  id: string
  url: string
  created_at?: string
  messages_config?: LiveV2MessagesConfig
}
