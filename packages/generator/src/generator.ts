import { BaseGenerator } from './generators/base.ts'
import { PythonGenerator } from './generators/python.ts'
import { TypeScriptGenerator } from './generators/typescript.ts'
import { collectAllReferencedObject } from './helpers.ts'
import { fetchSchema } from './schema-fetcher.ts'
import type { LiveV2Schemas, OpenAPIObject, ReferencedSchemaObject } from './types.ts'

export interface GeneratorOptions {
  schemaUrl: string
}

export class Generator {
  private options: GeneratorOptions
  private generators: BaseGenerator[] = []

  constructor(options: GeneratorOptions) {
    this.options = options
    this.generators.push(new TypeScriptGenerator())
    this.generators.push(new PythonGenerator())
  }

  async generate(): Promise<void> {
    console.log(`Fetching OpenAPI schema from: ${this.options.schemaUrl}`)
    const openapi = await fetchSchema(this.options.schemaUrl)
    console.log(`Schema loaded`)

    // Live V2
    const liveV2Schemas = this.preProcessSchemaForLiveV2(openapi)
    for (const generator of this.generators) {
      await generator.generateLiveV2(liveV2Schemas)
    }
  }

  private preProcessSchemaForLiveV2(openapi: OpenAPIObject): LiveV2Schemas {
    const initRequestRef = `#/components/schemas/StreamingRequest`
    const initResponseRef = `#/components/schemas/InitStreamingResponse`
    const wsMessagesRef: string[] = []
    const callbackMessagesRef: string[] = []
    const webhookMessagesRef: string[] = []
    const referencedTypes: Map<string, ReferencedSchemaObject> = new Map()

    collectAllReferencedObject({ $ref: initRequestRef }, openapi, referencedTypes)
    collectAllReferencedObject({ $ref: initResponseRef }, openapi, referencedTypes)

    for (const key of Object.keys(openapi.components?.schemas ?? {})) {
      if (key.match(/^CallbackLive.*Message$/)) {
        const ref = `#/components/schemas/${key}`
        callbackMessagesRef.push(ref)
        collectAllReferencedObject({ $ref: ref }, openapi, referencedTypes)

        const wsRef = `#/components/schemas/${key.replace('CallbackLive', '')}`
        wsMessagesRef.push(wsRef)
        collectAllReferencedObject({ $ref: wsRef }, openapi, referencedTypes)
      } else if (key.match(/^WebhookLive.*Payload$/)) {
        const ref = `#/components/schemas/${key}`
        webhookMessagesRef.push(ref)
        collectAllReferencedObject({ $ref: ref }, openapi, referencedTypes)
      }
    }

    return referencedTypes.entries().reduce<LiveV2Schemas>(
      (acc, [ref, refObject]) => {
        if (ref === initRequestRef) {
          refObject.typeName = `Init${refObject.typeName}`
          acc.initRequest = refObject
        } else if (ref === initResponseRef) {
          acc.initResponse = refObject
        } else if (wsMessagesRef.includes(ref)) {
          acc.wsMessages.push(refObject)
        } else if (callbackMessagesRef.includes(ref)) {
          acc.callbackMessages.push(refObject)
        } else if (webhookMessagesRef.includes(ref)) {
          refObject.typeName = refObject.typeName.replace(/Payload/, 'Message')
          acc.webhookMessages.push(refObject)
        } else {
          acc.referencedTypes.push(refObject)
        }

        this.renameObjectForLiveV2(refObject)

        return acc
      },
      {
        initRequest: referencedTypes.get(initRequestRef)!,
        initResponse: referencedTypes.get(initResponseRef)!,
        wsMessages: [],
        callbackMessages: [],
        webhookMessages: [],
        referencedTypes: [],
      }
    )
  }

  private renameObjectForLiveV2(refObject: ReferencedSchemaObject): void {
    refObject.typeName = refObject.typeName.replace(/(live|streaming|dto|supported|s?enum$)/gi, '')
    if (refObject.schema.enum) {
      refObject.typeName = refObject.typeName.replace(/(s$)/gi, '')
    }
    refObject.typeName = `LiveV2${refObject.typeName}`
  }
}
