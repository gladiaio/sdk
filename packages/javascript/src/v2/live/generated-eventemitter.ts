/*
 * This file is auto-generated. Do not edit manually.
 * Generated from OpenAPI schema.
 */

import {
  LiveV2AudioChunkAckMessage,
  LiveV2EndRecordingMessage,
  LiveV2EndSessionMessage,
  LiveV2NamedEntityRecognitionMessage,
  LiveV2PostChapterizationMessage,
  LiveV2PostFinalTranscriptMessage,
  LiveV2PostSummarizationMessage,
  LiveV2PostTranscriptMessage,
  LiveV2SentimentAnalysisMessage,
  LiveV2SpeechEndMessage,
  LiveV2SpeechStartMessage,
  LiveV2StartRecordingMessage,
  LiveV2StartSessionMessage,
  LiveV2StopRecordingAckMessage,
  LiveV2TranscriptMessage,
  LiveV2TranslationMessage,
  LiveV2WebSocketMessage,
} from './generated-types.js'

export interface LiveV2EventEmitter {
  on(
    type: LiveV2AudioChunkAckMessage['type'],
    cb: (message: LiveV2AudioChunkAckMessage) => void
  ): this
  on(
    type: LiveV2EndRecordingMessage['type'],
    cb: (message: LiveV2EndRecordingMessage) => void
  ): this
  on(type: LiveV2EndSessionMessage['type'], cb: (message: LiveV2EndSessionMessage) => void): this
  on(type: LiveV2TranslationMessage['type'], cb: (message: LiveV2TranslationMessage) => void): this
  on(
    type: LiveV2NamedEntityRecognitionMessage['type'],
    cb: (message: LiveV2NamedEntityRecognitionMessage) => void
  ): this
  on(
    type: LiveV2PostChapterizationMessage['type'],
    cb: (message: LiveV2PostChapterizationMessage) => void
  ): this
  on(
    type: LiveV2PostFinalTranscriptMessage['type'],
    cb: (message: LiveV2PostFinalTranscriptMessage) => void
  ): this
  on(
    type: LiveV2PostSummarizationMessage['type'],
    cb: (message: LiveV2PostSummarizationMessage) => void
  ): this
  on(
    type: LiveV2PostTranscriptMessage['type'],
    cb: (message: LiveV2PostTranscriptMessage) => void
  ): this
  on(
    type: LiveV2SentimentAnalysisMessage['type'],
    cb: (message: LiveV2SentimentAnalysisMessage) => void
  ): this
  on(
    type: LiveV2StartRecordingMessage['type'],
    cb: (message: LiveV2StartRecordingMessage) => void
  ): this
  on(
    type: LiveV2StartSessionMessage['type'],
    cb: (message: LiveV2StartSessionMessage) => void
  ): this
  on(
    type: LiveV2StopRecordingAckMessage['type'],
    cb: (message: LiveV2StopRecordingAckMessage) => void
  ): this
  on(type: LiveV2TranscriptMessage['type'], cb: (message: LiveV2TranscriptMessage) => void): this
  on(type: LiveV2SpeechStartMessage['type'], cb: (message: LiveV2SpeechStartMessage) => void): this
  on(type: LiveV2SpeechEndMessage['type'], cb: (message: LiveV2SpeechEndMessage) => void): this
  on(type: 'error', cb: (error: Error) => void): this
  on(type: LiveV2WebSocketMessage['type'] | 'error', cb: (event: any) => void): this

  once(
    type: LiveV2AudioChunkAckMessage['type'],
    cb: (message: LiveV2AudioChunkAckMessage) => void
  ): this
  once(
    type: LiveV2EndRecordingMessage['type'],
    cb: (message: LiveV2EndRecordingMessage) => void
  ): this
  once(type: LiveV2EndSessionMessage['type'], cb: (message: LiveV2EndSessionMessage) => void): this
  once(
    type: LiveV2TranslationMessage['type'],
    cb: (message: LiveV2TranslationMessage) => void
  ): this
  once(
    type: LiveV2NamedEntityRecognitionMessage['type'],
    cb: (message: LiveV2NamedEntityRecognitionMessage) => void
  ): this
  once(
    type: LiveV2PostChapterizationMessage['type'],
    cb: (message: LiveV2PostChapterizationMessage) => void
  ): this
  once(
    type: LiveV2PostFinalTranscriptMessage['type'],
    cb: (message: LiveV2PostFinalTranscriptMessage) => void
  ): this
  once(
    type: LiveV2PostSummarizationMessage['type'],
    cb: (message: LiveV2PostSummarizationMessage) => void
  ): this
  once(
    type: LiveV2PostTranscriptMessage['type'],
    cb: (message: LiveV2PostTranscriptMessage) => void
  ): this
  once(
    type: LiveV2SentimentAnalysisMessage['type'],
    cb: (message: LiveV2SentimentAnalysisMessage) => void
  ): this
  once(
    type: LiveV2StartRecordingMessage['type'],
    cb: (message: LiveV2StartRecordingMessage) => void
  ): this
  once(
    type: LiveV2StartSessionMessage['type'],
    cb: (message: LiveV2StartSessionMessage) => void
  ): this
  once(
    type: LiveV2StopRecordingAckMessage['type'],
    cb: (message: LiveV2StopRecordingAckMessage) => void
  ): this
  once(type: LiveV2TranscriptMessage['type'], cb: (message: LiveV2TranscriptMessage) => void): this
  once(
    type: LiveV2SpeechStartMessage['type'],
    cb: (message: LiveV2SpeechStartMessage) => void
  ): this
  once(type: LiveV2SpeechEndMessage['type'], cb: (message: LiveV2SpeechEndMessage) => void): this
  once(type: 'error', cb: (error: Error) => void): this
  once(type: LiveV2WebSocketMessage['type'] | 'error', cb: (event: any) => void): this

  off(
    type: LiveV2AudioChunkAckMessage['type'],
    cb?: (message: LiveV2AudioChunkAckMessage) => void
  ): this
  off(
    type: LiveV2EndRecordingMessage['type'],
    cb?: (message: LiveV2EndRecordingMessage) => void
  ): this
  off(type: LiveV2EndSessionMessage['type'], cb?: (message: LiveV2EndSessionMessage) => void): this
  off(
    type: LiveV2TranslationMessage['type'],
    cb?: (message: LiveV2TranslationMessage) => void
  ): this
  off(
    type: LiveV2NamedEntityRecognitionMessage['type'],
    cb?: (message: LiveV2NamedEntityRecognitionMessage) => void
  ): this
  off(
    type: LiveV2PostChapterizationMessage['type'],
    cb?: (message: LiveV2PostChapterizationMessage) => void
  ): this
  off(
    type: LiveV2PostFinalTranscriptMessage['type'],
    cb?: (message: LiveV2PostFinalTranscriptMessage) => void
  ): this
  off(
    type: LiveV2PostSummarizationMessage['type'],
    cb?: (message: LiveV2PostSummarizationMessage) => void
  ): this
  off(
    type: LiveV2PostTranscriptMessage['type'],
    cb?: (message: LiveV2PostTranscriptMessage) => void
  ): this
  off(
    type: LiveV2SentimentAnalysisMessage['type'],
    cb?: (message: LiveV2SentimentAnalysisMessage) => void
  ): this
  off(
    type: LiveV2StartRecordingMessage['type'],
    cb?: (message: LiveV2StartRecordingMessage) => void
  ): this
  off(
    type: LiveV2StartSessionMessage['type'],
    cb?: (message: LiveV2StartSessionMessage) => void
  ): this
  off(
    type: LiveV2StopRecordingAckMessage['type'],
    cb?: (message: LiveV2StopRecordingAckMessage) => void
  ): this
  off(type: LiveV2TranscriptMessage['type'], cb?: (message: LiveV2TranscriptMessage) => void): this
  off(
    type: LiveV2SpeechStartMessage['type'],
    cb?: (message: LiveV2SpeechStartMessage) => void
  ): this
  off(type: LiveV2SpeechEndMessage['type'], cb?: (message: LiveV2SpeechEndMessage) => void): this
  off(type: 'error', cb?: (error: Error) => void): this
  off(type: LiveV2WebSocketMessage['type'] | 'error', cb?: (event: any) => void): this

  addListener(
    type: LiveV2AudioChunkAckMessage['type'],
    cb: (message: LiveV2AudioChunkAckMessage) => void
  ): this
  addListener(
    type: LiveV2EndRecordingMessage['type'],
    cb: (message: LiveV2EndRecordingMessage) => void
  ): this
  addListener(
    type: LiveV2EndSessionMessage['type'],
    cb: (message: LiveV2EndSessionMessage) => void
  ): this
  addListener(
    type: LiveV2TranslationMessage['type'],
    cb: (message: LiveV2TranslationMessage) => void
  ): this
  addListener(
    type: LiveV2NamedEntityRecognitionMessage['type'],
    cb: (message: LiveV2NamedEntityRecognitionMessage) => void
  ): this
  addListener(
    type: LiveV2PostChapterizationMessage['type'],
    cb: (message: LiveV2PostChapterizationMessage) => void
  ): this
  addListener(
    type: LiveV2PostFinalTranscriptMessage['type'],
    cb: (message: LiveV2PostFinalTranscriptMessage) => void
  ): this
  addListener(
    type: LiveV2PostSummarizationMessage['type'],
    cb: (message: LiveV2PostSummarizationMessage) => void
  ): this
  addListener(
    type: LiveV2PostTranscriptMessage['type'],
    cb: (message: LiveV2PostTranscriptMessage) => void
  ): this
  addListener(
    type: LiveV2SentimentAnalysisMessage['type'],
    cb: (message: LiveV2SentimentAnalysisMessage) => void
  ): this
  addListener(
    type: LiveV2StartRecordingMessage['type'],
    cb: (message: LiveV2StartRecordingMessage) => void
  ): this
  addListener(
    type: LiveV2StartSessionMessage['type'],
    cb: (message: LiveV2StartSessionMessage) => void
  ): this
  addListener(
    type: LiveV2StopRecordingAckMessage['type'],
    cb: (message: LiveV2StopRecordingAckMessage) => void
  ): this
  addListener(
    type: LiveV2TranscriptMessage['type'],
    cb: (message: LiveV2TranscriptMessage) => void
  ): this
  addListener(
    type: LiveV2SpeechStartMessage['type'],
    cb: (message: LiveV2SpeechStartMessage) => void
  ): this
  addListener(
    type: LiveV2SpeechEndMessage['type'],
    cb: (message: LiveV2SpeechEndMessage) => void
  ): this
  addListener(type: 'error', cb: (error: Error) => void): this
  addListener(type: LiveV2WebSocketMessage['type'] | 'error', cb: (event: any) => void): this

  removeListener(
    type: LiveV2AudioChunkAckMessage['type'],
    cb?: (message: LiveV2AudioChunkAckMessage) => void
  ): this
  removeListener(
    type: LiveV2EndRecordingMessage['type'],
    cb?: (message: LiveV2EndRecordingMessage) => void
  ): this
  removeListener(
    type: LiveV2EndSessionMessage['type'],
    cb?: (message: LiveV2EndSessionMessage) => void
  ): this
  removeListener(
    type: LiveV2TranslationMessage['type'],
    cb?: (message: LiveV2TranslationMessage) => void
  ): this
  removeListener(
    type: LiveV2NamedEntityRecognitionMessage['type'],
    cb?: (message: LiveV2NamedEntityRecognitionMessage) => void
  ): this
  removeListener(
    type: LiveV2PostChapterizationMessage['type'],
    cb?: (message: LiveV2PostChapterizationMessage) => void
  ): this
  removeListener(
    type: LiveV2PostFinalTranscriptMessage['type'],
    cb?: (message: LiveV2PostFinalTranscriptMessage) => void
  ): this
  removeListener(
    type: LiveV2PostSummarizationMessage['type'],
    cb?: (message: LiveV2PostSummarizationMessage) => void
  ): this
  removeListener(
    type: LiveV2PostTranscriptMessage['type'],
    cb?: (message: LiveV2PostTranscriptMessage) => void
  ): this
  removeListener(
    type: LiveV2SentimentAnalysisMessage['type'],
    cb?: (message: LiveV2SentimentAnalysisMessage) => void
  ): this
  removeListener(
    type: LiveV2StartRecordingMessage['type'],
    cb?: (message: LiveV2StartRecordingMessage) => void
  ): this
  removeListener(
    type: LiveV2StartSessionMessage['type'],
    cb?: (message: LiveV2StartSessionMessage) => void
  ): this
  removeListener(
    type: LiveV2StopRecordingAckMessage['type'],
    cb?: (message: LiveV2StopRecordingAckMessage) => void
  ): this
  removeListener(
    type: LiveV2TranscriptMessage['type'],
    cb?: (message: LiveV2TranscriptMessage) => void
  ): this
  removeListener(
    type: LiveV2SpeechStartMessage['type'],
    cb?: (message: LiveV2SpeechStartMessage) => void
  ): this
  removeListener(
    type: LiveV2SpeechEndMessage['type'],
    cb?: (message: LiveV2SpeechEndMessage) => void
  ): this
  removeListener(type: 'error', cb?: (error: Error) => void): this
  removeListener(type: LiveV2WebSocketMessage['type'] | 'error', cb?: (event: any) => void): this

  removeAllListeners(): this

  emit(type: LiveV2AudioChunkAckMessage['type'], message: LiveV2AudioChunkAckMessage): this
  emit(type: LiveV2EndRecordingMessage['type'], message: LiveV2EndRecordingMessage): this
  emit(type: LiveV2EndSessionMessage['type'], message: LiveV2EndSessionMessage): this
  emit(type: LiveV2TranslationMessage['type'], message: LiveV2TranslationMessage): this
  emit(
    type: LiveV2NamedEntityRecognitionMessage['type'],
    message: LiveV2NamedEntityRecognitionMessage
  ): this
  emit(
    type: LiveV2PostChapterizationMessage['type'],
    message: LiveV2PostChapterizationMessage
  ): this
  emit(
    type: LiveV2PostFinalTranscriptMessage['type'],
    message: LiveV2PostFinalTranscriptMessage
  ): this
  emit(type: LiveV2PostSummarizationMessage['type'], message: LiveV2PostSummarizationMessage): this
  emit(type: LiveV2PostTranscriptMessage['type'], message: LiveV2PostTranscriptMessage): this
  emit(type: LiveV2SentimentAnalysisMessage['type'], message: LiveV2SentimentAnalysisMessage): this
  emit(type: LiveV2StartRecordingMessage['type'], message: LiveV2StartRecordingMessage): this
  emit(type: LiveV2StartSessionMessage['type'], message: LiveV2StartSessionMessage): this
  emit(type: LiveV2StopRecordingAckMessage['type'], message: LiveV2StopRecordingAckMessage): this
  emit(type: LiveV2TranscriptMessage['type'], message: LiveV2TranscriptMessage): this
  emit(type: LiveV2SpeechStartMessage['type'], message: LiveV2SpeechStartMessage): this
  emit(type: LiveV2SpeechEndMessage['type'], message: LiveV2SpeechEndMessage): this
  emit(type: 'error', error: Error): this
  emit(type: LiveV2WebSocketMessage['type'] | 'error', ...params: any[]): this
}
