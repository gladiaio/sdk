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

/**
 * Gladia Enterprise only: which event closes a final transcript.
 * - `end_of_turn`: the end of the speaker's turn; a pause inside a turn does not cut (voice agents).
 * - `sentence_or_end_of_turn`: the first of the end of a sentence or the end of the turn.
 * - `sentence`: a pause read as the end of a sentence; a number or an address being dictated is
 *   still held (meeting recorders, subtitles).
 * - `endpointing`: the `endpointing` silence or `maximum_duration_without_endpointing`, nothing
 *   else (the behaviour of Gladia's cloud API).
 */
export type LiveV2EnterpriseFinals =
  | 'end_of_turn'
  | 'sentence_or_end_of_turn'
  | 'sentence'
  | 'endpointing'

/**
 * Init options only the Gladia Enterprise API knows (`apiUrl` of your deployment). Gladia's cloud
 * API refuses them.
 */
export interface LiveV2EnterpriseInitOptions {
  /** Which event closes a final transcript. Omitted: the engine's default. */
  finals?: LiveV2EnterpriseFinals
}
