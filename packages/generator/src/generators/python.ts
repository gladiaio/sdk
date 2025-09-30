import { snakeCase } from 'case-anything'
import * as fs from 'fs'
import * as path from 'path'
import { isReferencedSchemaObject } from '../helpers.ts'
import type { ReferencedSchemaObject, SchemaOrReference } from '../types.ts'
import { BaseGenerator } from './base.ts'

const HEADER_BLOCK = `from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Literal

from dataclasses_json import DataClassJsonMixin


def _filter_none(_dict: dict[str, Any]) -> dict[str, Any]:
  return {
    k: _filter_none(v) if isinstance(v, dict) else v for k, v in _dict.items() if v is not None
  }


class BaseDataClass(DataClassJsonMixin):
  def to_dict(self, encode_json: bool = True) -> dict[str, Any]:
    dict = super().to_dict(encode_json=encode_json)
    return _filter_none(dict)
`

type OrderedProperty = {
  name: string
  schema: SchemaOrReference
  required: boolean
}

type UnionHelperConfig = {
  sectionTitle: string
  mapName: string
  helperPrefix: string
  discriminator: string
  unionType: string
}

type ResolvedType = {
  annotation: string
  nullable: boolean
}

export class PythonGenerator extends BaseGenerator {
  private maxLineLength: number

  constructor() {
    super()

    try {
      const pyprojectPath = path.join(this.getSdkFolder(), 'pyproject.toml')
      const content = fs.readFileSync(pyprojectPath, 'utf-8')
      const lineLengthMatch = content.match(/\[tool\.ruff\][\s\S]*?line-length\s*=\s*(\d+)/)
      this.maxLineLength = lineLengthMatch ? parseInt(lineLengthMatch[1], 10) : 88
    } catch {
      this.maxLineLength = 88
    }
  }

  override get sdkName(): string {
    return 'sdk-python'
  }

  override getFileExtension(): string {
    return '.py'
  }

  override getSourceFolder(): string {
    return 'src/gladiaio_sdk'
  }

  override formatFilename(filename: string): string {
    return snakeCase(filename)
  }

  override generateSingleLineComment(text: string): string {
    return this.formatComment(text, '# ')
  }

  override generateMultiLineComment(text: string): string {
    return this.formatComment(text, '# ')
  }

  override getGeneratedFileHeader(): string {
    const baseHeader = super.getGeneratedFileHeader()
    return `${baseHeader}\n${HEADER_BLOCK}`
  }

  override generateTypeDefinition({
    typeName,
    description,
    schema,
  }: ReferencedSchemaObject): string {
    if (schema.type === 'object' && schema.properties) {
      return this.generateDataclass(typeName, description, schema)
    }

    if (schema.enum) {
      return this.generateEnum(typeName, schema.enum)
    }

    return `# ${typeName} = ${this.getPythonType(schema)}`
  }

  override generateUnionType(
    name: string,
    schemas: ReferencedSchemaObject[],
    sectionComment?: string
  ): string {
    const comment = sectionComment ? `${this.generateSingleLineComment(sectionComment)}\n` : ''
    const unionMembers = schemas.map(({ typeName }) => typeName)
    const inline = `${name} = ${unionMembers.join(' | ')}`

    const helperConfig = this.getUnionHelperConfig(name)

    if (inline.length <= this.maxLineLength) {
      let result = `${comment}${inline}`
      if (helperConfig) {
        result += this.generateMessageHelpers(helperConfig, schemas)
      }
      return result
    }

    const multiline = unionMembers
      .map((member, index) => `${index === 0 ? '' : '    | '}${member}`)
      .join('\n')

    let result = `${comment}${name} = (\n    ${multiline}\n)`

    if (helperConfig) {
      result += this.generateMessageHelpers(helperConfig, schemas)
    }

    return result
  }

  override resolveUnionTypes(items: SchemaOrReference[]): string[] {
    const result: string[] = []

    for (const item of items) {
      const type = this.getPythonType(item)
      if (type && !result.includes(type)) {
        result.push(type)
      }
    }

    return result
  }

  private formatComment(text: string, prefix: string): string {
    const maxCommentLength = this.maxLineLength - prefix.length

    return text
      .split('\n')
      .map((line) => {
        if (line.length <= maxCommentLength) {
          return `${prefix}${line}`
        }

        const words = line.split(' ')
        const lines: string[] = []
        let currentLine = ''

        for (const word of words) {
          if (currentLine.length + word.length + 1 <= maxCommentLength) {
            currentLine += (currentLine ? ' ' : '') + word
          } else {
            if (currentLine) {
              lines.push(`${prefix}${currentLine}`)
            }
            currentLine = word
          }
        }

        if (currentLine) {
          lines.push(`${prefix}${currentLine}`)
        }

        return lines.join('\n')
      })
      .join('\n')
  }

  private generateDataclass(
    typeName: string,
    description: string | undefined,
    schema: SchemaOrReference & {
      properties?: Record<string, SchemaOrReference>
      required?: string[]
    }
  ): string {
    const lines: string[] = []
    const orderedProps = this.orderProperties(
      schema.properties ?? {},
      new Set(schema.required ?? [])
    )

    lines.push('@dataclass(frozen=True, slots=True)')
    lines.push(`class ${typeName}(BaseDataClass):`)

    if (description) {
      lines.push(`    """${description}"""`)
    }

    if (orderedProps.length === 0) {
      lines.push('    pass')
      return lines.join('\n')
    }

    const required_lines: string[] = []
    const optional_lines: string[] = []
    for (const { name, schema: propertySchema, required } of orderedProps) {
      const { annotation, nullable } = this.resolvePythonType(propertySchema)
      const isOptional = nullable || !required
      const _line = isOptional ? optional_lines : required_lines

      if ((propertySchema as any).description) {
        _line.push(...this.formatComment((propertySchema as any).description, '    # ').split('\n'))
      }

      if (isOptional) {
        _line.push(`    ${name}: ${annotation} | None = None`)
      } else {
        _line.push(`    ${name}: ${annotation}`)
      }
    }

    lines.push(...required_lines)
    lines.push(...optional_lines)

    return lines.join('\n')
  }

  private orderProperties(
    properties: Record<string, SchemaOrReference>,
    required: Set<string>
  ): OrderedProperty[] {
    const result: OrderedProperty[] = []

    Object.entries(properties)
      .filter(([name]) => required.has(name))
      .forEach(([name, schema]) => result.push({ name, schema, required: true }))

    Object.entries(properties)
      .filter(([name]) => !required.has(name))
      .forEach(([name, schema]) => result.push({ name, schema, required: false }))

    return result
  }

  private resolvePythonType(schemaOrRef: SchemaOrReference): ResolvedType {
    const annotation = this.getPythonType(schemaOrRef)
    const nullable = this.isNullable(schemaOrRef)
    return { annotation, nullable }
  }

  private getPythonType(schemaOrRef: SchemaOrReference): string {
    if (isReferencedSchemaObject(schemaOrRef)) {
      return schemaOrRef.typeName
    }

    if (schemaOrRef.enum) {
      return this.generateInlineEnum(schemaOrRef.enum)
    }

    if (schemaOrRef.oneOf || schemaOrRef.anyOf || schemaOrRef.allOf?.length === 1) {
      const members = schemaOrRef.oneOf || schemaOrRef.anyOf || schemaOrRef.allOf || []
      const unions = this.resolveUnionTypes(members)

      if (unions.length === 1) {
        return unions[0]
      }

      return unions.length > 0 ? unions.join(' | ') : 'Any'
    }

    if (Array.isArray(schemaOrRef.type)) {
      const nonNull = schemaOrRef.type.filter((item) => item !== 'null')
      if (nonNull.length === 1) {
        return this.getPythonType({ ...schemaOrRef, type: nonNull[0] })
      }
      return 'Any'
    }

    switch (schemaOrRef.type) {
      case 'string':
        return 'str'
      case 'integer':
        return 'int'
      case 'number':
        return 'float'
      case 'boolean':
        return 'bool'
      case 'array':
        return `list[${schemaOrRef.items ? this.getPythonType(schemaOrRef.items) : 'Any'}]`
      case 'object': {
        if (schemaOrRef.additionalProperties) {
          if (typeof schemaOrRef.additionalProperties === 'boolean') {
            return 'dict[str, Any]'
          }
          const valueType = this.getPythonType(schemaOrRef.additionalProperties)
          return `dict[str, ${valueType}]`
        }
        return 'dict[str, Any]'
      }
      default:
        return 'Any'
    }
  }

  private generateInlineEnum(values: Array<string | number>): string {
    const literalItems = values.map((value) =>
      typeof value === 'string' ? `"${value}"` : value.toString()
    )
    const inline = `Literal[${literalItems.join(', ')}]`

    if (inline.length <= this.maxLineLength) {
      return inline
    }

    const formatted = literalItems
      .map((item, index) => `        ${item}${index === literalItems.length - 1 ? '' : ','}`)
      .join('\n')

    return `Literal[\n${formatted}\n    ]`
  }

  private generateEnum(typeName: string, values: Array<string | number>): string {
    const literalItems = values.map((value) =>
      typeof value === 'string' ? `"${value}"` : value.toString()
    )
    const inline = `Literal[${literalItems.join(', ')}]`

    if (inline.length + typeName.length + 3 <= this.maxLineLength) {
      return `${typeName} = ${inline}`
    }

    const formatted = literalItems
      .map((item, index) => `    ${item}${index === literalItems.length - 1 ? '' : ','}`)
      .join('\n')

    return `${typeName} = Literal[\n${formatted}\n]`
  }

  private isNullable(schemaOrRef: SchemaOrReference): boolean {
    if (isReferencedSchemaObject(schemaOrRef)) {
      return this.isNullable(schemaOrRef.schema)
    }

    if (schemaOrRef.nullable) {
      return true
    }

    if (Array.isArray(schemaOrRef.type)) {
      return schemaOrRef.type.includes('null')
    }

    return false
  }

  private getUnionHelperConfig(name: string): UnionHelperConfig | undefined {
    switch (name) {
      case 'LiveV2WebSocketMessage':
        return {
          sectionTitle: 'websocket',
          mapName: '_WS_TYPE_TO_CLASS',
          helperPrefix: 'web_socket',
          discriminator: 'type',
          unionType: name,
        }
      case 'LiveV2CallbackMessage':
        return {
          sectionTitle: 'callback',
          mapName: '_CALLBACK_EVENT_TO_CLASS',
          helperPrefix: 'callback',
          discriminator: 'event',
          unionType: name,
        }
      case 'LiveV2WebhookMessage':
        return {
          sectionTitle: 'webhook',
          mapName: '_WEBHOOK_EVENT_TO_CLASS',
          helperPrefix: 'webhook',
          discriminator: 'event',
          unionType: name,
        }
      default:
        return undefined
    }
  }

  private generateMessageHelpers(
    config: UnionHelperConfig,
    schemas: ReferencedSchemaObject[]
  ): string {
    const entries = schemas
      .map((schema) => this.makeMappingEntry(schema, config.discriminator))
      .filter((value): value is string => Boolean(value))

    if (entries.length === 0) {
      return ''
    }

    const lines: string[] = []
    lines.push('')
    lines.push(`${config.mapName}: dict[str, type[${config.unionType}]] = {`)
    lines.push(...entries)
    lines.push('}')
    lines.push('')
    lines.push(
      `def create_live_v2_${config.helperPrefix}_message_from_dict(payload: dict[str, Any]) -> ${config.unionType}:`
    )
    lines.push(`    message_key = payload.get("${config.discriminator}")`)
    lines.push('')
    lines.push('    if not isinstance(message_key, str):')
    lines.push(
      `        raise ValueError("Missing or invalid '${config.discriminator}' field in ${config.sectionTitle} message payload")`
    )
    lines.push('')
    lines.push('    try:')
    lines.push(`        cls = ${config.mapName}[message_key]`)
    lines.push('    except KeyError as exc:')
    lines.push(
      `        raise ValueError(f"Unsupported ${config.sectionTitle} message ${config.discriminator}: {message_key}") from exc`
    )
    lines.push('')
    lines.push('    return cls.from_dict(payload)')
    lines.push('')
    lines.push(
      `def create_live_v2_${config.helperPrefix}_message_from_json(data: str | bytes | bytearray) -> ${config.unionType}:`
    )
    lines.push('    parsed = json.loads(data)')
    lines.push('    if not isinstance(parsed, dict):')
    lines.push(
      `        raise ValueError("${config.sectionTitle} message JSON must represent an object")`
    )
    lines.push('')
    lines.push(`    return create_live_v2_${config.helperPrefix}_message_from_dict(parsed)`)
    lines.push('')

    return lines.join('\n')
  }

  private makeMappingEntry(
    schema: ReferencedSchemaObject,
    discriminator: string
  ): string | undefined {
    const property = schema.schema.properties?.[discriminator]

    if (!property) {
      return undefined
    }

    const literalValue = this.extractSingleLiteral(property)

    if (!literalValue) {
      return undefined
    }

    return `    "${literalValue}": ${schema.typeName},`
  }

  private extractSingleLiteral(schemaOrRef: SchemaOrReference): string | undefined {
    if (isReferencedSchemaObject(schemaOrRef)) {
      return this.extractSingleLiteral(schemaOrRef.schema)
    }

    if (schemaOrRef.enum && schemaOrRef.enum.length === 1) {
      const value = schemaOrRef.enum[0]
      return typeof value === 'string' ? value : undefined
    }

    if ((schemaOrRef as { const?: unknown }).const) {
      const value = (schemaOrRef as { const?: unknown }).const
      return typeof value === 'string' ? value : undefined
    }

    return undefined
  }
}
