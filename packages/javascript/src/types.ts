export type Headers = Record<string, string>

type BaseRetryOptions = {
  /**
   * The function used to determine the delay between retries.
   * It takes one parameter, attemptCount, starting at 1.
   *
   * Default is (attemptCount) => 0.3 * (2 ** (attemptCount - 1)) * 1000
   */
  delay?: (attemptCount: number) => number
}

export type HttpRetryOptions = {
  /**
   * Maximum number of attempts for an HTTP request.
   * 0 for unlimited. 1 for no retry.
   *
   * Default is 2.
   */
  maxAttempts?: number

  /**
   * List of status codes eligible for retry. You can specify a range by using a tuple.
   *
   * Default for HTTP is [408, 413, 429, [500, 599]].
   */
  statusCodes?: (number | [start: number, end: number])[]

  /**
   * The maximum delay per retry in milliseconds.
   *
   * Default is 10000.
   */
  maxDelay?: number
} & BaseRetryOptions

export type WebSocketRetryOptions = {
  /**
   * Maximum number of attempts for a WS connection.
   * 0 for unlimited. 1 for no retry.
   * Once connected, the number of attempts to reconnect is reset.
   *
   * Default is 5.
   */
  maxAttemptsPerConnection?: number

  /**
   * The maximum delay per retry in milliseconds.
   *
   * Default is 2000.
   */
  maxDelay?: number
} & BaseRetryOptions & {
    /**
     * Maximum number of WS connections.
     * 0 for unlimited. 1 for no reconnection.
     *
     * Default is 0.
     */
    maxConnections?: number

    /**
     * List of close code eligible for reconnection. You can specify a range by using a tuple.
     * Default is [[1002, 4399], [4500, 9999]].
     */
    closeCodes?: (number | [start: number, end: number])[]
  }

export type GladiaClientOptions = {
  /**
   * Your Gladia API key.
   * You can obtain one by going to https://app.gladia.io.
   *
   * If you are using this client from a browser or in public code, you can omit it and give a different baseUrl pointing to a server you control.
   * The server will have to act as a proxy to https://api.gladia.io and only add the header "x-gladia-key" with your API key.
   *
   * If not provided, the client will use the API key from the environment variable GLADIA_API_KEY.
   */
  apiKey?: string

  /**
   * Base API URL used for the API calls to Gladia.
   *
   * You can modify it to proxy the requests.
   *
   * If not provided, the client will take the environment variable GLADIA_API_URL and, if not provided either, it will default to https://api.gladia.io.
   */
  apiUrl?: string

  /**
   * Region to use.
   *
   * If not provided, the client will take the environment variable GLADIA_REGION and, if not provided either, it will default to 'eu-west'.
   */
  region?: 'eu-west' | 'us-west'

  /**
   * Custom headers to add to the HTTP requests.
   */
  httpHeaders?: Headers | [string, string][]

  /**
   * Control the retry behavior for HTTP requests.
   *
   * Retries are not triggered following a timeout.
   *
   * Default is {limit: 2, statusCodes: [408, 413, 429, [500, 599]], maxDelay: 10000, delay: (attemptCount) => 0.3 * (2 ** (attemptCount - 1)) * 1000}
   */
  httpRetry?: HttpRetryOptions

  /**
   * Timeout for HTTP requests in milliseconds.
   *
   * Retries are not triggered following a timeout.
   *
   * Default is 10000.
   */
  httpTimeout?: number

  /**
   * Control the retry behavior for WebSocket connections and re-connections after a close event.
   * Attempt count resets after a successful WebSocket connection.
   *
   * Retries are not triggered following a timeout.
   *
   * Default is {limit: 5, closeCodes: [[1002, 4399], [4500, 9999]], maxDelay: 2000, delay: (attemptCount) => 0.3 * (2 ** (attemptCount - 1)) * 1000}
   */
  wsRetry?: WebSocketRetryOptions

  /**
   * Timeout for WebSocket connections and re-connections after a close event in milliseconds.
   *
   * Retries are not triggered following a timeout.
   *
   * Default is 10000.
   */
  wsTimeout?: number
}

export type InternalGladiaClientOptions = Pick<GladiaClientOptions, 'apiKey' | 'region'> &
  Required<
    Omit<GladiaClientOptions, 'apiKey' | 'region' | 'httpHeaders' | 'httpRetry' | 'wsRetry'>
  > & {
    httpHeaders: Headers
    httpRetry: Required<HttpRetryOptions>
    wsRetry: Required<WebSocketRetryOptions>
  }
