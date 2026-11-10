import type { UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow acronyms in subjects (HTTP, API, CI, WebSocket, OpenAPI, etc.).
    'subject-case': [0],
  },
}

export default config
