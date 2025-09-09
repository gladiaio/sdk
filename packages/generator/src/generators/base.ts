import { promises as fs } from 'fs'
import { createRequire } from 'module'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { getSdkFolder } from '../helpers.ts'
import type { LiveV2Schemas, ReferencedSchemaObject, SchemaOrReference } from '../types.ts'

const require = createRequire(import.meta.url)
const mustache = require('mustache')

const __filename = fileURLToPath(new URL(import.meta.url))
const __dirname = path.dirname(__filename)

export abstract class BaseGenerator {
  abstract get sdkName(): string

  async generateLiveV2(schemas: LiveV2Schemas): Promise<void> {
    console.log(`Generating code for Live V2 SDK (${this.sdkName})`)

    await this.generateLiveV2Types(schemas)
    await this.generateLiveV2EventEmitter(schemas)

    console.log(`Generated code for Live V2 SDK (${this.sdkName})`)
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

  /**
   * Abstract methods to be implemented by language-specific generators
   */
  abstract getFileExtension(): string
  abstract getSourceFolder(): string
  abstract resolveUnionTypes(items: SchemaOrReference[]): string[]

  // Comment generation methods
  abstract generateSingleLineComment(text: string): string
  abstract generateMultiLineComment(text: string): string

  // Abstract method for type definition generation
  abstract generateTypeDefinition(schema: ReferencedSchemaObject): Promise<string> | string

  // Abstract method for union type generation
  abstract generateUnionType(
    name: string,
    typeNames: ReferencedSchemaObject[],
    sectionComment?: string
  ): string

  // Abstract method to get template path for event emitter
  abstract getEventEmitterTemplatePath(): string

  /**
   * Render template using Mustache
   */
  protected renderTemplate(template: string, data: any): string {
    return mustache.render(template, data)
  }

  /**
   * Prepare event emitter template data
   */
  protected prepareEventEmitterData(schemas: LiveV2Schemas) {
    const methods = [
      {
        methodName: 'on',
        methodDescription: 'Add an event listener',
        optionalCb: false,
      },
      {
        methodName: 'once',
        methodDescription: 'Add a one-time event listener',
        optionalCb: false,
      },
      {
        methodName: 'off',
        methodDescription: 'Remove an event listener',
        optionalCb: true,
      },
      {
        methodName: 'addListener',
        methodDescription: 'Add an event listener (alias for on)',
        optionalCb: false,
      },
      {
        methodName: 'removeListener',
        methodDescription: 'Remove an event listener (alias for off)',
        optionalCb: true,
      },
      {
        methodName: 'emit',
        methodDescription: 'Emit an event with typed message',
        isEmit: true,
      },
    ]

    return {
      messages: schemas.wsMessages,
      methods,
    }
  }

  /**
   * Generate live event emitter using template system
   */
  async generateLiveV2EventEmitter(schemas: LiveV2Schemas): Promise<void> {
    console.log(`Generating event emitter for Live V2 SDK (${this.sdkName})`)

    const templatePath = path.join(__dirname, '..', 'templates', this.getEventEmitterTemplatePath())
    const template = await fs.readFile(templatePath, 'utf-8')

    const data = this.prepareEventEmitterData(schemas)
    const content = this.renderTemplate(template, data)

    const outputPath = `${this.getSdkFolder()}/${this.getSourceFolder()}/v2/live/generated-eventemitter${this.getFileExtension()}`
    await this.writeFile(outputPath, content)

    console.log(`Generated event emitter for Live V2 SDK (${this.sdkName})`)
  }

  // Common file header generation
  getGeneratedFileHeader(): string {
    return this.generateMultiLineComment(
      'This file is auto-generated. Do not edit manually.\n' + 'Generated from OpenAPI schema.'
    )
  }

  // Helper method to generate live types with common structure
  protected async generateTypes(
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
   * @returns the path to the sdk package where the generator will output its results
   */
  protected getSdkFolder(): string {
    return getSdkFolder(this.sdkName)
  }

  /**
   * Write content to a file
   */
  protected async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  }
}
