import { promises as fs } from 'fs'
import * as path from 'path'
import { getSdkFolder } from '../helpers.ts'
import type { LiveV2Schemas, ReferencedSchemaObject, SchemaOrReference } from '../types.ts'

export abstract class BaseGenerator {
  async generateLiveV2(schemas: LiveV2Schemas): Promise<void> {
    console.log(`Generating code for Live V2 SDK (${this.sdkName})`)

    await this.generateLiveV2Types(schemas)

    console.log(`Generated code for Live V2 SDK (${this.sdkName})`)
  }

  protected abstract get sdkName(): string
  protected abstract getFileExtension(): string
  protected abstract getSourceFolder(): string
  protected getSdkFolder(): string {
    return getSdkFolder(this.sdkName)
  }

  /**
   * Generate live streaming types from OpenAPI schema
   */
  private async generateLiveV2Types(schemas: LiveV2Schemas): Promise<void> {
    console.log(`Generating types for Live V2 SDK (${this.sdkName})`)

    const initSessionContent =
      '\n\n' +
      (await this.generateTypes([schemas.initRequest, schemas.initResponse], 'Init Session'))

    const wsMessagesContent =
      '\n\n' +
      (await this.generateTypes(schemas.wsMessages, 'WebSocket Messages')) +
      '\n\n' +
      this.generateUnionType(
        'LiveV2WebSocketMessage',
        schemas.wsMessages,
        'Union of all websocket messages'
      )

    const callbackMessagesContent =
      '\n\n' +
      (await this.generateTypes(schemas.callbackMessages, 'Callback Messages')) +
      '\n\n' +
      this.generateUnionType(
        'LiveV2CallbackMessage',
        schemas.callbackMessages,
        'Union of all callback messages'
      )

    const webhookMessagesContent =
      '\n\n' +
      (await this.generateTypes(schemas.webhookMessages, 'Webhook Messages')) +
      '\n\n' +
      this.generateUnionType(
        'LiveV2WebhookMessage',
        schemas.webhookMessages,
        'Union of all webhook messages'
      )

    const sharedContent =
      '\n\n' + (await this.generateTypes(schemas.referencedTypes, 'Shared Types'))

    // Combine all content with header comment
    const header = this.getGeneratedFileHeader()
    const allContent = [
      header,
      sharedContent,
      initSessionContent,
      wsMessagesContent,
      callbackMessagesContent,
      webhookMessagesContent,
    ]
      .filter((content) => content.trim())
      .join('\n\n')

    // Write to the appropriate file
    const outputPath = `${this.getSdkFolder()}/${this.getSourceFolder()}/v2/live/generated-types${this.getFileExtension()}`
    await this.writeFile(outputPath, allContent)

    console.log(`Generated types for Live V2 SDK (${this.sdkName})`)
  }

  protected abstract resolveUnionTypes(items: SchemaOrReference[]): string[]

  // Comment generation methods
  protected abstract generateSingleLineComment(text: string): string
  protected abstract generateMultiLineComment(text: string): string

  // Abstract method for type definition generation
  protected abstract generateTypeDefinition(
    schema: ReferencedSchemaObject
  ): Promise<string> | string

  // Abstract method for union type generation
  protected abstract generateUnionType(
    name: string,
    typeNames: ReferencedSchemaObject[],
    sectionComment?: string
  ): string

  // Common file header generation
  getGeneratedFileHeader(): string {
    return this.generateMultiLineComment(
      'This file is auto-generated. Do not edit manually.\n' + 'Generated from OpenAPI schema.'
    )
  }

  // Helper method to generate live types with common structure
  private async generateTypes(
    types: ReferencedSchemaObject[],
    sectionName: string
  ): Promise<string> {
    let content = this.generateSingleLineComment(`${sectionName} Types`) + '\n'
    for (const schema of types) {
      content += (await this.generateTypeDefinition(schema)) + '\n\n'
    }
    return content
  }

  /**
   * Write content to a file
   */
  private async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  }
}
