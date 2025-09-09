import type { GladiaClientOptions } from '../../types.js'
import type { LiveV2EventEmitter } from './generated-eventemitter.js'
import type { LiveV2Session as BaseLiveV2Session } from './session.js'

export type LiveV2ClientOptions = GladiaClientOptions & { apiUrl: string }
export type LiveV2Session = Omit<BaseLiveV2Session, keyof LiveV2EventEmitter> & LiveV2EventEmitter
