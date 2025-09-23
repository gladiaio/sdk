import { kebabCase } from 'case-anything'
import { isReferencedSchemaObject } from '../helpers.ts'
import type { ReferencedSchemaObject, SchemaOrReference } from '../types.ts'
import { BaseGenerator } from './base.ts'

export class TypeScriptGenerator extends BaseGenerator {
  override get sdkName(): string {
    return 'sdk-js'
  }

  override getFileExtension(): string {
    return '.ts'
  }

  override getSourceFolder(): string {
    return 'src'
  }

  override formatFilename(filename: string): string {
    return kebabCase(filename)
  }

  override generateSingleLineComment(text: string): string {
    return text
      .split('\n')
      .map((line) => `// ${line}`)
      .join('\n')
  }

  override generateMultiLineComment(text: string): string {
    const lines = text.split('\n')
    if (lines.length === 1) {
      return `// ${lines[0]}`
    }
    return '/*\n' + lines.map((line) => ` * ${line}`).join('\n') + '\n */'
  }

  override generateTypeDefinition(schema: ReferencedSchemaObject): string {
    if (schema.schema.type === 'object' && schema.schema.properties) {
      return this.generateInterface(schema)
    } else if (schema.schema.enum) {
      return this.generateEnum(schema)
    } else {
      return `export type ${schema.typeName} = ${this.getTypeScriptType(schema)};`
    }
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

    const unionTypes = schemas.map(({ typeName }) => typeName).join(' | ')
    content += `export type ${name} = ${unionTypes};`

    return content
  }

  override resolveUnionTypes(items: SchemaOrReference[]): string[] {
    const types: string[] = []

    for (const item of items) {
      const resolvedType = this.getTypeScriptType(item)
      if (resolvedType && !types.includes(resolvedType)) {
        types.push(resolvedType)
      }
    }

    return types
  }

  private generateInterface({
    typeName: name,
    schema,
    description,
  }: ReferencedSchemaObject): string {
    let content = ''
    if (description) {
      content += `/** ${description} */\n`
    }
    content += `export interface ${name} {\n`

    if (schema.properties) {
      for (const [propName, propSchemaOrRef] of Object.entries(schema.properties)) {
        const isRequired = schema.required?.includes(propName) ?? false
        const optional = isRequired ? '' : '?'
        const type = this.getTypeScriptType(propSchemaOrRef)
        if (propSchemaOrRef.description) {
          content += `  /** ${propSchemaOrRef.description} */\n`
        }
        content += `  ${propName}${optional}: ${type};\n`
      }
    }

    content += '}'
    return content
  }

  private generateEnum({ typeName: name, schema }: ReferencedSchemaObject): string {
    if (!schema.enum) {
      return `export type ${name} = string;`
    }

    // Check if all enum values are numeric
    const allNumeric = schema.enum.every((value) => !isNaN(Number(value)))

    if (allNumeric) {
      // Generate numeric union type
      const values = schema.enum.map((value) => String(value)).join(' | ')
      return `export type ${name} = ${values};`
    } else {
      // Generate string union type
      const values = schema.enum.map((value) => `'${value}'`).join(' | ')
      return `export type ${name} = ${values};`
    }
  }

  private getTypeScriptType(schemaOrRef: SchemaOrReference): string {
    if (isReferencedSchemaObject(schemaOrRef)) {
      return schemaOrRef.typeName
    }

    const schema = schemaOrRef

    // Handle union types (oneOf/anyOf/allOf)
    if (schema.oneOf || schema.anyOf || schema.allOf?.length === 1) {
      const items = schema.oneOf || schema.anyOf || schema.allOf || []
      const resolvedTypes = this.resolveUnionTypes(items)
      if (resolvedTypes.length > 0) {
        return resolvedTypes.join(' | ')
      }
    }

    if (schema.enum) {
      // Handle enum types inline
      const allNumeric = schema.enum.every((value) => !isNaN(Number(value)))
      if (allNumeric) {
        return schema.enum.map((value) => String(value)).join(' | ')
      } else {
        return schema.enum.map((value) => `'${value}'`).join(' | ')
      }
    }

    switch (schema.type) {
      case 'string': {
        return 'string'
      }
      case 'number':
      case 'integer': {
        return 'number'
      }
      case 'boolean': {
        return 'boolean'
      }
      case 'array': {
        if (schema.items) {
          const itemType = this.getTypeScriptType(schema.items)
          return `Array<${itemType}>`
        }
        return 'Array<any>'
      }
      case 'object': {
        let objectDefinitionWithDefinedProperties: string | null = null
        if (schema.properties && Object.entries(schema.properties).length) {
          // For inline objects with properties
          objectDefinitionWithDefinedProperties = '{ '
          for (const [propName, propSchemaOrRef] of Object.entries(schema.properties)) {
            const isRequired = schema.required?.includes(propName) ?? false
            const optional = isRequired ? '' : '?'
            objectDefinitionWithDefinedProperties += `${propName}${optional}: ${this.getTypeScriptType(
              propSchemaOrRef
            )}; `
          }
          objectDefinitionWithDefinedProperties += '}'
        }

        let objectDefinitionWithAdditionalProperties: string | null = null
        if (schema.additionalProperties) {
          // Handle Record types with only additionalProperties
          if (typeof schema.additionalProperties === 'boolean') {
            objectDefinitionWithAdditionalProperties = 'Record<string, any>'
          } else if (Object.keys(schema.additionalProperties).length) {
            const valueType = this.getTypeScriptType(schema.additionalProperties)
            objectDefinitionWithAdditionalProperties = `Record<string, ${valueType}>`
          }
        }

        return (
          [objectDefinitionWithDefinedProperties, objectDefinitionWithAdditionalProperties]
            .filter(Boolean)
            .join(' & ') || 'object'
        )
      }
      default: {
        console.warn(`Schema not supported: ${JSON.stringify(schemaOrRef)}`)
        return 'any'
      }
    }
  }
}
