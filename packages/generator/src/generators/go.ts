import { pascalCase, snakeCase } from 'case-anything'
import {
  assertSafeIdentifier,
  isNumericLiteral,
  isReferencedSchemaObject,
  normalizeCommentText,
  toJsDocText,
} from '../helpers.ts'
import type {
  LiveV2Schemas,
  PreRecordedV2Schemas,
  ReferencedSchemaObject,
  SchemaOrReference,
} from '../types.ts'
import { BaseGenerator } from './base.ts'

function toGoStringLiteral(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `"${escaped}"`
}

const GO_KEYWORDS = new Set([
  'break',
  'case',
  'chan',
  'const',
  'continue',
  'default',
  'defer',
  'else',
  'fallthrough',
  'for',
  'func',
  'go',
  'goto',
  'if',
  'import',
  'interface',
  'map',
  'package',
  'range',
  'return',
  'select',
  'struct',
  'switch',
  'type',
  'var',
])

export class GoGenerator extends BaseGenerator {
  private currentPackage = 'live'

  private fieldOverrides: Map<string, boolean> = new Map([
    ['PreRecordedV2Response.post_session_metadata', true],
    ['LiveV2Response.post_session_metadata', true],
  ])

  override get sdkName(): string {
    return 'sdk-go'
  }

  override getFileExtension(): string {
    return '.go'
  }

  override getSourceFolder(): string {
    return '.'
  }

  override formatFilename(filename: string): string {
    return snakeCase(filename)
  }

  override async generateLiveV2(schemas: LiveV2Schemas): Promise<void> {
    this.currentPackage = 'live'
    await super.generateLiveV2(schemas)
  }

  override async generatePreRecordedV2(schemas: PreRecordedV2Schemas): Promise<void> {
    this.currentPackage = 'prerecorded'
    await super.generatePreRecordedV2(schemas)
  }

  override getGeneratedFileHeader(): string {
    const comment = super.getGeneratedFileHeader()
    return `${comment}\n\npackage ${this.currentPackage}\n`
  }

  override generateSingleLineComment(text: string): string {
    return normalizeCommentText(text)
      .split('\n')
      .map((line) => `// ${line}`)
      .join('\n')
  }

  override generateMultiLineComment(text: string): string {
    const lines = normalizeCommentText(text).split('\n')
    if (lines.length === 1) {
      return `// ${lines[0]}`
    }
    return '/*\n' + lines.map((line) => ` * ${line}`).join('\n') + '\n */'
  }

  override generateTypeDefinition(schema: ReferencedSchemaObject): string {
    assertSafeIdentifier(schema.typeName, 'type')
    if (schema.schema.type === 'object' && schema.schema.properties) {
      return this.generateStruct(schema)
    }
    if (schema.schema.enum) {
      return this.generateEnum(schema)
    }
    return `type ${schema.typeName} = ${this.getGoType(schema.schema)}`
  }

  override generateUnionType(
    name: string,
    schemas: ReferencedSchemaObject[],
    sectionComment?: string
  ): string {
    let content = ''
    if (sectionComment) {
      content += this.generateSingleLineComment(sectionComment) + '\n'
    }
    assertSafeIdentifier(name, 'type')
    const members = schemas.map(({ typeName }) => {
      assertSafeIdentifier(typeName, 'type')
      return typeName
    })
    content += this.generateSingleLineComment(`Union members: ${members.join(', ')}`) + '\n'
    content += `type ${name} any`
    return content
  }

  override resolveUnionTypes(items: SchemaOrReference[]): string[] {
    const types: string[] = []
    for (const item of items) {
      const resolvedType = this.getGoType(item)
      if (resolvedType && !types.includes(resolvedType)) {
        types.push(resolvedType)
      }
    }
    return types
  }

  private goFieldName(jsonName: string): string {
    let name = pascalCase(jsonName)
    if (GO_KEYWORDS.has(name.toLowerCase())) {
      name = `${name}_`
    }
    assertSafeIdentifier(name, 'field')
    return name
  }

  private generateStruct({ typeName: name, schema, description }: ReferencedSchemaObject): string {
    let content = ''
    if (description) {
      content += `// ${toJsDocText(description).replace(/\n/g, '\n// ')}\n`
    }
    content += `type ${name} struct {\n`

    if (schema.properties) {
      for (const [propName, propSchemaOrRef] of Object.entries(schema.properties)) {
        const overrideKey = `${name}.${propName}`
        const shouldForceOptional = this.fieldOverrides.get(overrideKey) === true
        const isRequired = (schema.required?.includes(propName) ?? false) && !shouldForceOptional
        const isNullable = isReferencedSchemaObject(propSchemaOrRef)
          ? propSchemaOrRef.schema.nullable
          : propSchemaOrRef.nullable
        const baseType = this.getGoType(propSchemaOrRef)
        const goType = this.applyOptionality(
          baseType,
          !isRequired || isNullable,
          isNullable && isRequired
        )
        const fieldName = this.goFieldName(propName)
        const omitempty = !isRequired ? ',omitempty' : ''
        if (propSchemaOrRef.description) {
          content += `\t// ${toJsDocText(propSchemaOrRef.description).replace(/\n/g, '\n\t// ')}\n`
        }
        content += `\t${fieldName} ${goType} \`json:"${propName}${omitempty}"\`\n`
      }
    }

    content += '}'
    return content
  }

  private applyOptionality(baseType: string, optional: boolean, nullableRequired: boolean): string {
    if (!optional) {
      return baseType
    }
    if (baseType.startsWith('[]') || baseType.startsWith('map[')) {
      return baseType
    }
    if (nullableRequired || baseType !== 'any') {
      return `*${baseType}`
    }
    return baseType
  }

  private generateEnum({ typeName: name, schema }: ReferencedSchemaObject): string {
    if (!schema.enum) {
      return `type ${name} string`
    }

    const allNumeric = schema.enum.every(isNumericLiteral)
    const underlying = allNumeric ? 'int' : 'string'
    const lines: string[] = [`type ${name} ${underlying}`, '', 'const (']
    const usedNames = new Set<string>()

    for (const [index, value] of schema.enum.entries()) {
      const suffix = allNumeric ? String(value) : pascalCase(String(value)) || `Value${index}`
      let constName = `${name}${suffix}`
      if (!isSafeGoConstName(constName) || usedNames.has(constName)) {
        constName = `${name}Value${index}`
      }
      usedNames.add(constName)
      const literal = allNumeric ? String(value) : toGoStringLiteral(String(value))
      lines.push(`\t${constName} ${name} = ${literal}`)
    }

    lines.push(')')
    return lines.join('\n')
  }

  private getGoType(schemaOrRef: SchemaOrReference): string {
    if (isReferencedSchemaObject(schemaOrRef)) {
      assertSafeIdentifier(schemaOrRef.typeName, 'type')
      return schemaOrRef.typeName
    }

    const schema = schemaOrRef

    if (schema.oneOf || schema.anyOf || schema.allOf?.length === 1) {
      const items = schema.oneOf || schema.anyOf || schema.allOf || []
      const resolvedTypes = this.resolveUnionTypes(items)
      if (resolvedTypes.length === 1) {
        return resolvedTypes[0]
      }
      if (resolvedTypes.length > 1) {
        return 'any'
      }
    }

    if (schema.enum) {
      const allNumeric = schema.enum.every(isNumericLiteral)
      return allNumeric ? 'int' : 'string'
    }

    if (Array.isArray(schema.type)) {
      const nonNull = schema.type.filter((item) => item !== 'null')
      if (nonNull.length === 1) {
        return this.getGoType({ ...schema, type: nonNull[0] })
      }
      return 'any'
    }

    switch (schema.type) {
      case 'string':
        return 'string'
      case 'integer':
        return 'int'
      case 'number':
        return 'float64'
      case 'boolean':
        return 'bool'
      case 'array': {
        if (schema.items) {
          return `[]${this.getGoType(schema.items)}`
        }
        return '[]any'
      }
      case 'object': {
        if (schema.additionalProperties) {
          if (typeof schema.additionalProperties === 'boolean') {
            return 'map[string]any'
          }
          const valueType = this.getGoType(schema.additionalProperties)
          return `map[string]${valueType}`
        }
        if (schema.properties && Object.keys(schema.properties).length > 0) {
          return 'map[string]any'
        }
        return 'map[string]any'
      }
      default:
        console.warn(`Schema not supported for Go: ${JSON.stringify(schemaOrRef)}`)
        return 'any'
    }
  }
}

function isSafeGoConstName(name: string): boolean {
  return /^[A-Z][A-Za-z0-9_]*$/.test(name)
}
