import * as fs from 'fs'
import * as path from 'path'
import { isReferencedSchemaObject } from '../helpers.ts'
import type { ReferencedSchemaObject, SchemaOrReference } from '../types.ts'
import { BaseGenerator } from './base.ts'

export class PythonGenerator extends BaseGenerator {
  private maxLineLength: number

  constructor() {
    super()

    try {
      const pyprojectPath = path.join(this.getSdkFolder(), 'pyproject.toml')
      const content = fs.readFileSync(pyprojectPath, 'utf-8')

      const lineLengthMatch = content.match(/\[tool\.ruff\][\s\S]*?line-length\s*=\s*(\d+)/)

      if (lineLengthMatch) {
        this.maxLineLength = parseInt(lineLengthMatch[1], 10)
      } else {
        // Fallback to default PEP 8 recommendation
        this.maxLineLength = 88
      }
    } catch {
      // Fallback to default if file reading fails
      this.maxLineLength = 88
    }
  }

  get sdkName(): string {
    return 'python'
  }

  protected getSdkFolder(): string {
    return '../python'
  }

  getFileExtension(): string {
    return '.py'
  }

  getSourceFolder(): string {
    return 'python'
  }

  generateSingleLineComment(text: string): string {
    return this.formatComment(text, '# ')
  }

  generateMultiLineComment(text: string): string {
    return this.formatComment(text, '# ')
  }

  private formatComment(text: string, prefix: string): string {
    const maxCommentLength = this.maxLineLength - prefix.length

    return text
      .split('\n')
      .map((line) => {
        if (line.length <= maxCommentLength) {
          return `${prefix}${line}`
        }

        // Break long lines at word boundaries
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

  /**
   * Get the template path for Python event emitter
   */
  getEventEmitterTemplatePath(): string {
    return 'python/event-emitter.py.template'
  }

  /**
   * Override header generation to include Python-specific imports
   */
  getGeneratedFileHeader(): string {
    const baseHeader = super.getGeneratedFileHeader()
    return baseHeader + '\nfrom typing import Any, Literal, TypedDict'
  }

  generateTypeDefinition(schema: ReferencedSchemaObject): string {
    if (schema.schema.type === 'object' && schema.schema.properties) {
      return this.generateTypedDict(schema)
    } else if (schema.schema.enum) {
      return this.generateEnum(schema)
    } else {
      return `# ${schema.typeName} = ${this.getPythonType(schema)}`
    }
  }

  generateUnionType(
    name: string,
    schemas: ReferencedSchemaObject[],
    sectionComment?: string
  ): string {
    let content = ''

    if (sectionComment) {
      content += this.generateSingleLineComment(sectionComment) + '\n'
    }

    // Format union types on multiple lines if too long
    const unionTypes = schemas.map(({ typeName }) => typeName).join(' | ')

    if (unionTypes.length + name.length + 3 > this.maxLineLength) {
      // Multi-line format
      const formattedTypes = schemas
        .map(({ typeName }, index) => {
          const prefix = index === 0 ? '' : '    | '
          return `${prefix}${typeName}`
        })
        .join('\n')
      content += `${name} = (\n    ${formattedTypes}\n)`
    } else {
      // Single line format
      content += `${name} = ${unionTypes}`
    }

    return content
  }

  private generateTypedDict({ typeName, schema, description }: ReferencedSchemaObject): string {
    let content = `class ${typeName}(TypedDict):\n`

    if (description) {
      content += `    """${description}"""\n`
    }

    if (schema.properties) {
      for (const [propName, propSchemaOrRef] of Object.entries(schema.properties)) {
        const isRequired = schema.required?.includes(propName) ?? false
        const pythonType = this.getPythonType(propSchemaOrRef)

        // Use automatic type resolution from base class
        // pythonType = this.getResolvedType(name, propName, pythonType)

        const fieldType = isRequired ? pythonType : `${pythonType} | None`

        if (propSchemaOrRef.description) {
          const formattedComment = this.formatComment(propSchemaOrRef.description, '    # ')
          content += `${formattedComment}\n`
        }

        content += `    ${propName}: ${fieldType}\n`
      }
    } else {
      content += '    pass\n'
    }

    return content
  }

  resolveUnionTypes(items: SchemaOrReference[]): string[] {
    const types: string[] = []
    for (const item of items) {
      const resolvedType = this.getPythonType(item)
      if (resolvedType && !types.includes(resolvedType)) {
        types.push(resolvedType)
      }
    }
    return types
  }

  private generateEnum({ typeName: name, schema }: ReferencedSchemaObject): string {
    if (!schema.enum) {
      return `${name} = str`
    }

    // Check if all enum values are numeric
    const allNumeric = schema.enum.every((value) => !isNaN(Number(value)))

    if (allNumeric) {
      // Generate numeric union type
      const values = schema.enum.map((value) => String(value))
      const unionTypes = values.join(' | ')
      const maxLineLength = this.maxLineLength

      if (unionTypes.length + name.length + 3 > maxLineLength) {
        // Multi-line format
        const formattedValues = values
          .map((value, index) => {
            const prefix = index === 0 ? '' : '    | '
            return `${prefix}${value}`
          })
          .join('\n')
        return `${name} = (\n    ${formattedValues}\n)`
      } else {
        return `${name} = ${unionTypes}`
      }
    } else {
      // Generate Literal type for string enums
      const values = schema.enum.map((value) => `"${value}"`)
      const literalContent = values.join(', ')
      const maxLineLength = this.maxLineLength

      if (literalContent.length + name.length + 12 > maxLineLength) {
        // 12 for ' = Literal[]'
        // Multi-line format
        const formattedValues = values
          .map((value, index) => {
            const prefix = index === 0 ? '' : '    '
            return `${prefix}${value}`
          })
          .join(',\n')
        return `${name} = Literal[\n    ${formattedValues}\n]`
      } else {
        return `${name} = Literal[${literalContent}]`
      }
    }
  }

  private getPythonType(schemaOrRef: SchemaOrReference): string {
    if (isReferencedSchemaObject(schemaOrRef)) {
      return schemaOrRef.typeName
    }

    const schema = schemaOrRef

    // Handle union types (oneOf/anyOf/allOf)
    if (schema.oneOf || schema.anyOf || schema.allOf?.length === 1) {
      const items = schema.oneOf || schema.anyOf || schema.allOf || []
      const resolvedTypes = this.resolveUnionTypes(items)
      if (resolvedTypes.length > 0) {
        const unionTypes = resolvedTypes.join(' | ')
        // For inline types, keep single line but consider parentheses for very long unions
        if (unionTypes.length > 60) {
          return `(${unionTypes})`
        }
        return unionTypes
      }
    }

    if (schema.enum) {
      // Handle enum types inline
      const enumValues = schema.enum
      const allNumbers = enumValues.every((val) => typeof val === 'number')

      if (allNumbers) {
        // For numeric enums, create union of numbers
        const unionTypes = enumValues.join(' | ')
        if (unionTypes.length > 60) {
          return `(${unionTypes})`
        }
        return unionTypes
      } else {
        // For string enums, use Literal type
        const stringValues = enumValues.map((val) => `"${val}"`)
        const literalContent = stringValues.join(', ')
        return `Literal[${literalContent}]`
      }
    }

    switch (schema.type) {
      case 'string': {
        return 'str'
      }
      case 'number': {
        return 'float'
      }
      case 'integer': {
        return 'int'
      }
      case 'boolean': {
        return 'bool'
      }
      case 'array': {
        if (schema.items) {
          return `list[${this.getPythonType(schema.items)}]`
        }
        return 'list[Any]'
      }
      case 'object': {
        if (schema.additionalProperties) {
          if (typeof schema.additionalProperties === 'boolean') {
            return 'dict[str, Any]'
          } else if (Object.keys(schema.additionalProperties).length) {
            const valueType = this.getPythonType(schema.additionalProperties)
            return `dict[str, ${valueType}]`
          }
        }

        if (schema.properties) {
          // Generate inline TypedDict for objects with properties
          const propTypes: string[] = []

          for (const [propName, propSchemaOrRef] of Object.entries(schema.properties)) {
            const isRequired = schema.required?.includes(propName) ?? false
            const propType = this.getPythonType(propSchemaOrRef)
            const finalType = isRequired ? propType : `${propType} | None`
            propTypes.push(`'${propName}': ${finalType}`)
          }

          return `TypedDict('InlineObject', {${propTypes.join(', ')}})`
        }
        return 'dict[str, Any]'
      }
      default: {
        console.warn(`Schema not supported: ${JSON.stringify(schemaOrRef)}`)
        return 'Any'
      }
    }
  }
}
