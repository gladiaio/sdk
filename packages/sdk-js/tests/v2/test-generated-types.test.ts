/**
 * Tests for generated types (Live V2 message shapes).
 * Mirrors Python test_generated_types: message structure with and without error.
 */

import { describe, expect, it } from 'vitest'
import type {
  LiveV2StopRecordingAckMessage,
  LiveV2StopRecordingAckData,
  LiveV2Error,
} from '../../src/v2/live/generated-types.js'

describe('LiveV2StopRecordingAckMessage', () => {
  it('message without error: data present, error null', () => {
    const messageData: LiveV2StopRecordingAckMessage = {
      session_id: '123',
      created_at: '2021-01-01T00:00:00Z',
      acknowledged: true,
      type: 'stop_recording',
      data: {
        recording_duration: 10,
        recording_left_to_process: 10,
      },
      error: null,
    }
    expect(messageData.error).toBeNull()
    expect(messageData.data).not.toBeNull()
    expect((messageData.data as LiveV2StopRecordingAckData).recording_duration).toBe(10)
    expect((messageData.data as LiveV2StopRecordingAckData).recording_left_to_process).toBe(10)
  })

  it('message with error: data null, error present', () => {
    const messageData: LiveV2StopRecordingAckMessage = {
      session_id: '123',
      created_at: '2021-01-01T00:00:00Z',
      acknowledged: true,
      type: 'stop_recording',
      data: null,
      error: {
        message: 'Error message',
      },
    }
    expect(messageData.data).toBeNull()
    expect(messageData.error).not.toBeNull()
    expect((messageData.error as LiveV2Error).message).toBe('Error message')
  })

  it('parsed from JSON without error', () => {
    const json = `{
      "session_id": "123",
      "created_at": "2021-01-01T00:00:00Z",
      "acknowledged": true,
      "type": "stop_recording",
      "data": {
        "recording_duration": 10,
        "recording_left_to_process": 10
      },
      "error": null
    }`
    const message = JSON.parse(json) as LiveV2StopRecordingAckMessage
    expect(message.error).toBeNull()
    expect(message.data).not.toBeNull()
    expect(message.data!.recording_duration).toBe(10)
    expect(message.data!.recording_left_to_process).toBe(10)
  })

  it('parsed from JSON with error', () => {
    const json = `{
      "session_id": "123",
      "created_at": "2021-01-01T00:00:00Z",
      "acknowledged": true,
      "type": "stop_recording",
      "data": null,
      "error": {
        "message": "Error message"
      }
    }`
    const message = JSON.parse(json) as LiveV2StopRecordingAckMessage
    expect(message.data).toBeNull()
    expect(message.error).not.toBeNull()
    expect(message.error!.message).toBe('Error message')
  })
})
