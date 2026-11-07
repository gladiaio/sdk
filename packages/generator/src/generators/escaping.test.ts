import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import {
  assertSafeIdentifier,
  assertSafePythonIdentifier,
  isNumericLiteral,
  normalizeCommentText,
  toJsDocText,
  toPythonDocstringText,
  toPythonStringLiteral,
  toTypeScriptStringLiteral,
} from '../helpers.ts'
import type { ReferencedSchemaObject, SchemaObjectRefLess } from '../types.ts'
import { PythonGenerator } from './python.ts'
import { TypeScriptGenerator } from './typescript.ts'

// Schema strings that try to leave the literal, comment or declaration they are emitted in
const HOSTILE_STRINGS = [
  "a'; globalThis.injected = true; //",
  'a"; globalThis.injected = true; //',
  'x */ globalThis.injected = true; /*',
  'x """ injected = True """',
  'line\nbreak',
  'carriage\rreturn',
  'line\u2028separator',
  'paragraph\u2029separator',
  'back\\slash',
  'trailing backslash\\',
  'nul\u0000byte',
  'tab\tand\u001bescape',
]

function referenced(typeName: string, schema: SchemaObjectRefLess, description?: string) {
  return { originalName: typeName, typeName, description, schema } satisfies ReferencedSchemaObject
}

/** Parse TypeScript source and return its top-level statements, failing on syntax errors. */
function parseTypeScript(source: string): readonly ts.Statement[] {
  const file = ts.createSourceFile('generated.ts', source, ts.ScriptTarget.Latest, true)
  const diagnostics = (file as unknown as { parseDiagnostics: ts.Diagnostic[] }).parseDiagnostics
  expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([])
  return file.statements
}

describe('string literal escaping', () => {
  it.each(HOSTILE_STRINGS)('TypeScript literal round-trips %j', (value) => {
    const literal = toTypeScriptStringLiteral(value)
    const statements = parseTypeScript(`export type T = ${literal};`)
    expect(statements).toHaveLength(1)
    expect(new Function(`return ${literal}`)()).toBe(value)
  })

  it.each(HOSTILE_STRINGS)('Python literal round-trips %j', (value) => {
    const literal = toPythonStringLiteral(value)
    // The emitted escapes are a subset shared by Python and JSON string literals
    expect(JSON.parse(literal)).toBe(value)
    expect(literal).not.toMatch(/[\n\r\u2028\u2029]/)
  })
})

describe('comment and docstring text', () => {
  it('normalizes every line terminator to \\n and drops control characters', () => {
    expect(normalizeCommentText('a\r\nb\rc\u2028d\u2029e\u0000f\tg')).toBe('a\nb\nc\nd\nef\tg')
  })

  it('cannot close a JSDoc comment', () => {
    expect(toJsDocText('x */ y')).not.toContain('*/')
  })

  it('cannot close a Python docstring', () => {
    const text = toPythonDocstringText('x """ y "')
    expect(text).not.toMatch(/(^|[^\\])"/)
  })
})

describe('identifiers', () => {
  it('accepts plain identifiers', () => {
    expect(() => assertSafeIdentifier('LiveV2InitRequest', 'type')).not.toThrow()
    expect(() => assertSafeIdentifier('audio_url', 'property')).not.toThrow()
    expect(() => assertSafeIdentifier('_private', 'property')).not.toThrow()
  })

  it.each(['', ' padded', '1abc', 'a-b', 'a b', 'x: string; }', 'x"', 'é', undefined])(
    'rejects %j',
    (name) => {
      expect(() => assertSafeIdentifier(name, 'type')).toThrow(/Invalid type name/)
    }
  )

  it('rejects Python keywords for Python output', () => {
    expect(() => assertSafePythonIdentifier('from', 'property')).toThrow(/Python keyword/)
    expect(() => assertSafePythonIdentifier('type', 'property')).not.toThrow()
  })

  it('only treats real numbers as numeric enum values', () => {
    expect([1, 2.5, '3', '-4', '1e3'].every(isNumericLiteral)).toBe(true)
    expect(['', ' ', ' 1', '0x10', 'Infinity', '1;', Number.NaN].some(isNumericLiteral)).toBe(false)
  })
})

describe('TypeScriptGenerator', () => {
  const generator = new TypeScriptGenerator()

  it('keeps hostile enum values inside string literals', () => {
    const output = generator.generateTypeDefinition(
      referenced('HostileEnum', { type: 'string', enum: [...HOSTILE_STRINGS, 'ok'] })
    )
    const statements = parseTypeScript(output)
    expect(statements).toHaveLength(1)
    expect(ts.isTypeAliasDeclaration(statements[0])).toBe(true)
  })

  it('keeps hostile descriptions inside comments and quotes unusual property names', () => {
    const properties = Object.fromEntries(
      HOSTILE_STRINGS.map((value, index) => [
        `${value}${index}`,
        { type: 'string' as const, description: value },
      ])
    )
    const output = generator.generateTypeDefinition(
      referenced('HostileObject', { type: 'object', properties }, HOSTILE_STRINGS.join(' '))
    )
    const statements = parseTypeScript(output)
    expect(statements).toHaveLength(1)
    const declaration = statements[0]
    if (!ts.isInterfaceDeclaration(declaration)) {
      throw new Error('Expected an interface declaration')
    }
    expect(declaration.members).toHaveLength(HOSTILE_STRINGS.length)
  })

  it('quotes unusual property names in inline objects', () => {
    const output = generator.generateTypeDefinition(
      referenced('Inline', {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            properties: { [HOSTILE_STRINGS[0]]: { type: 'string' } },
          },
        },
      })
    )
    expect(parseTypeScript(output)).toHaveLength(1)
  })

  it('keeps real numeric enums as number literals', () => {
    expect(
      generator.generateTypeDefinition(referenced('Rate', { type: 'integer', enum: [8000, 16000] }))
    ).toBe('export type Rate = 8000 | 16000;')
  })

  it('emits non-numeric strings as string literals', () => {
    expect(
      generator.generateTypeDefinition(referenced('Mixed', { type: 'string', enum: ['1', ' 2'] }))
    ).toBe(`export type Mixed = '1' | ' 2';`)
  })

  it('refuses unsafe type names', () => {
    expect(() =>
      generator.generateTypeDefinition(referenced('Bad = 1; export const x', { type: 'string' }))
    ).toThrow(/Invalid type name/)
  })
})

describe('PythonGenerator', () => {
  const generator = new PythonGenerator()

  it('keeps hostile enum values inside string literals', () => {
    const output = generator.generateTypeDefinition(
      referenced('HostileEnum', { type: 'string', enum: [...HOSTILE_STRINGS, 'ok'] })
    )
    for (const value of HOSTILE_STRINGS) {
      expect(output).toContain(toPythonStringLiteral(value))
    }
    // Only the line breaks of the multi-line Literal formatting remain
    for (const line of output.split('\n').slice(1, -1)) {
      expect(line).toMatch(/^ {4}".*",?$/)
    }
  })

  it('keeps hostile descriptions inside the docstring and comments', () => {
    const output = generator.generateTypeDefinition(
      referenced(
        'HostileClass',
        {
          type: 'object',
          properties: { field: { type: 'string', description: HOSTILE_STRINGS.join(' ') } },
          required: ['field'],
        },
        'Doc """ string'
      )
    )
    const lines = output.split('\n')
    expect(lines[2]).toBe('    """Doc \\"\\"\\" string"""')
    // Every line of the class body is a comment, the docstring or a field
    for (const line of lines.slice(3)) {
      expect(line).toMatch(/^ {4}(# |field: str$|_unknown_fields: CatchAll)/)
    }
  })

  it('refuses unsafe class and property names', () => {
    expect(() =>
      generator.generateTypeDefinition(referenced('Bad(object): pass\nclass X', { type: 'string' }))
    ).toThrow(/Invalid type name/)
    expect(() =>
      generator.generateTypeDefinition(
        referenced('Good', { type: 'object', properties: { 'x: int = 1\n': { type: 'string' } } })
      )
    ).toThrow(/Invalid property name/)
  })

  it('escapes discriminator values in the message mapping', () => {
    const hostile = HOSTILE_STRINGS[1]
    const output = generator.generateUnionType('LiveV2CallbackMessage', [
      referenced('LiveV2CallbackHostileMessage', {
        type: 'object',
        properties: { event: { type: 'string', enum: [hostile] } },
        required: ['event'],
      }),
    ])
    expect(output).toContain(`    ${toPythonStringLiteral(hostile)}: LiveV2CallbackHostileMessage,`)
  })
})
