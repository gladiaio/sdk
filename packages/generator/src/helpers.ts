import { existsSync } from 'fs'
import { isReferenceObject } from 'openapi3-ts/oas31'
import * as path from 'path'

import {
  type OpenAPIObject,
  type ReferencedSchemaObject,
  type ReferenceObject,
  type SchemaObject,
  type SchemaObjectRefLess,
  type SchemaOrReference,
} from './types.ts'

export { isReferenceObject }

export function getSdkFolder(sdk: string) {
  const folder = path.join(new URL('.', import.meta.url).pathname, '..', '..', sdk)
  if (!existsSync(folder)) {
    throw new Error(`No folder found for sdk ${sdk} at path ${folder}`)
  }
  return folder
}

// ---------------------------------------------------------------------------
// Emission helpers for OpenAPI-derived text.
//
// Every string that comes from the OpenAPI schema (descriptions, enum values,
// type, property and discriminator names) is untrusted input as far as the
// generated sources are concerned. It must go through one of these helpers
// before being interpolated into TypeScript or Python code.
// ---------------------------------------------------------------------------

const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/

// Hard keywords cannot be used as Python attribute or class names
const PYTHON_KEYWORDS = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
])

/**
 * Whether a name can be emitted verbatim as an identifier in both the
 * TypeScript and the Python SDK (plain ASCII identifier).
 */
export function isSafeIdentifier(name: unknown): name is string {
  return typeof name === 'string' && SAFE_IDENTIFIER.test(name)
}

/**
 * Throw if a schema-derived name cannot be emitted verbatim as an identifier.
 * Generation fails instead of writing a file that could contain arbitrary code.
 */
export function assertSafeIdentifier(name: unknown, kind: string): asserts name is string {
  if (!isSafeIdentifier(name)) {
    throw new Error(`Invalid ${kind} name in OpenAPI schema: ${JSON.stringify(name)}`)
  }
}

/**
 * Same as `assertSafeIdentifier`, also rejecting Python keywords.
 */
export function assertSafePythonIdentifier(name: unknown, kind: string): asserts name is string {
  assertSafeIdentifier(name, kind)
  if (PYTHON_KEYWORDS.has(name)) {
    throw new Error(`Invalid ${kind} name in OpenAPI schema (Python keyword): ${name}`)
  }
}

function hex4(char: string): string {
  return char.charCodeAt(0).toString(16).padStart(4, '0')
}

const COMMON_ESCAPES: Record<string, string> = {
  '\\': '\\\\',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
}

/**
 * Escape a value for a single-quoted TypeScript string literal: backslashes,
 * quotes, control characters and the U+2028/U+2029 line terminators.
 */
export function toTypeScriptStringLiteral(value: string): string {
  // eslint-disable-next-line no-control-regex
  const escaped = value.replace(/[\\'\u0000-\u001f\u007f\u2028\u2029]/g, (char) => {
    if (char === "'") return "\\'"
    return COMMON_ESCAPES[char] ?? `\\u${hex4(char)}`
  })
  return `'${escaped}'`
}

/**
 * Escape a value for a double-quoted Python string literal: backslashes,
 * quotes and control characters.
 */
export function toPythonStringLiteral(value: string): string {
  // eslint-disable-next-line no-control-regex
  const escaped = value.replace(/[\\"\u0000-\u001f\u007f\u2028\u2029]/g, (char) => {
    if (char === '"') return '\\"'
    return COMMON_ESCAPES[char] ?? `\\u${hex4(char)}`
  })
  return `"${escaped}"`
}

/**
 * Normalize schema text before it goes into a comment or a docstring: every
 * line terminator becomes `\n` (so line comments can prefix each line) and the
 * other control characters are dropped.
 */
export function normalizeCommentText(value: string): string {
  return (
    value
      .replace(/\r\n?|[\u2028\u2029]/g, '\n')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
  )
}

/**
 * Make schema text safe inside a `/** ... *\/` block comment.
 */
export function toJsDocText(value: string): string {
  return normalizeCommentText(value).replace(/\*\//g, '*\\/')
}

/**
 * Make schema text safe inside a `"""..."""` Python docstring. Line breaks are
 * kept, backslashes and double quotes are escaped so the docstring cannot be
 * closed early.
 */
export function toPythonDocstringText(value: string): string {
  return normalizeCommentText(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Whether an enum value can be emitted as a bare numeric literal.
 */
export function isNumericLiteral(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }
  return (
    typeof value === 'string' &&
    /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(value)
  )
}

export function isReferencedSchemaObject(
  schema: SchemaObjectRefLess | ReferencedSchemaObject
): schema is ReferencedSchemaObject {
  return Boolean(
    'originalName' in schema &&
      schema['originalName'] &&
      'typeName' in schema &&
      schema['typeName'] &&
      'schema' in schema &&
      schema['schema']
  )
}

export function collectAllReferencedObject(
  { $ref, description, summary }: ReferenceObject,
  openapi: OpenAPIObject,
  acc: Map<string, ReferencedSchemaObject>
): void {
  // Check if this reference is already processed
  if (acc.has($ref)) {
    return
  }

  const refParts = $ref.split('/')
  const name = refParts[refParts.length - 1]
  let currentDescription = description
  let currentSummary = summary

  // Follow the reference chain to find the final schema
  let referencedObject = openapi.components?.schemas?.[name]

  // Follow reference chain without collecting intermediate references
  while (isReferenceObject(referencedObject)) {
    currentDescription ||= referencedObject.description
    currentSummary ||= referencedObject.summary
    const nextRefParts: string[] = referencedObject.$ref.split('/')
    const nextName: string = nextRefParts[nextRefParts.length - 1]
    referencedObject = openapi.components?.schemas?.[nextName]
  }

  if (!referencedObject) {
    throw new Error(`Invalid ref: ${$ref}`)
  }

  const schemaRefLess = convertSchemaToRefLess(referencedObject, openapi, acc)

  const referencedSchema: ReferencedSchemaObject = {
    originalName: name,
    typeName: name,
    description: currentDescription,
    summary: currentSummary,
    schema: schemaRefLess,
  }

  acc.set($ref, referencedSchema)
}

function convertSchemaToRefLess(
  schema: SchemaObject,
  openapi: OpenAPIObject,
  acc: Map<string, ReferencedSchemaObject>
): SchemaObjectRefLess {
  const {
    $ref,
    allOf,
    oneOf,
    anyOf,
    not,
    items,
    properties,
    additionalProperties,
    propertyNames,
    prefixItems,
    ...rest
  } = schema

  const result: SchemaObjectRefLess = { ...rest }

  // Process allOf
  if (allOf) {
    result.allOf = allOf.map((item: SchemaObject | ReferenceObject) =>
      processSchemaOrReference(item, openapi, acc)
    )
  }

  // Process oneOf
  if (oneOf) {
    result.oneOf = oneOf.map((item: SchemaObject | ReferenceObject) =>
      processSchemaOrReference(item, openapi, acc)
    )
  }

  // Process anyOf
  if (anyOf) {
    result.anyOf = anyOf.map((item: SchemaObject | ReferenceObject) =>
      processSchemaOrReference(item, openapi, acc)
    )
  }

  // Process not
  if (not) {
    result.not = processSchemaOrReference(not, openapi, acc)
  }

  // Process items
  if (items) {
    result.items = processSchemaOrReference(items, openapi, acc)
  }

  // Process properties
  if (properties) {
    result.properties = {}
    for (const [key, value] of Object.entries(properties)) {
      result.properties[key] = processSchemaOrReference(value, openapi, acc)
    }
  }

  // Process additionalProperties
  if (additionalProperties) {
    if (typeof additionalProperties === 'boolean') {
      result.additionalProperties = additionalProperties
    } else {
      result.additionalProperties = processSchemaOrReference(additionalProperties, openapi, acc)
    }
  }

  // Process propertyNames
  if (propertyNames) {
    result.propertyNames = processSchemaOrReference(propertyNames, openapi, acc)
  }

  // Process prefixItems
  if (prefixItems) {
    result.prefixItems = prefixItems.map((item: SchemaObject | ReferenceObject) =>
      processSchemaOrReference(item, openapi, acc)
    )
  }

  return result
}

function processSchemaOrReference(
  schemaOrRef: SchemaObject | ReferenceObject,
  openapi: OpenAPIObject,
  acc: Map<string, ReferencedSchemaObject>
): SchemaOrReference {
  if (isReferenceObject(schemaOrRef)) {
    // Process the reference and add to accumulator
    collectAllReferencedObject(schemaOrRef, openapi, acc)

    // Find the processed reference in accumulator
    const found = acc.get(schemaOrRef.$ref)
    if (!found) {
      throw new Error(`Failed to process reference: ${schemaOrRef.$ref}`)
    }

    return found
  } else {
    // Convert SchemaObject to SchemaObjectRefLess
    return convertSchemaToRefLess(schemaOrRef, openapi, acc)
  }
}

/**
 * Build a synthetic object schema from OpenAPI path operation query parameters.
 * Also adds an optional `url` field for following pagination `next` links (SDK UX).
 */
export function buildListParamsSchema(
  openapi: OpenAPIObject,
  pathKey: string,
  originalName: string,
  description: string,
  acc: Map<string, ReferencedSchemaObject>
): ReferencedSchemaObject {
  const operation = openapi.paths?.[pathKey]?.get
  if (!operation) {
    throw new Error(`Missing GET operation for path ${pathKey}`)
  }

  const properties: { [propertyName: string]: SchemaOrReference } = {}
  const parameters = operation.parameters ?? []

  for (const param of parameters) {
    if (isReferenceObject(param)) {
      throw new Error(`Parameter $ref not supported for list params: ${param.$ref}`)
    }
    if (param.in !== 'query') {
      continue
    }
    if (!param.schema) {
      throw new Error(`Missing schema for query parameter ${param.name} on ${pathKey}`)
    }

    const propSchema = processSchemaOrReference(
      param.schema as SchemaObject | ReferenceObject,
      openapi,
      acc
    )
    if (param.description) {
      propSchema.description = param.description
    }
    properties[param.name] = propSchema
  }

  // SDK-only pagination helper: follow absolute `next` / `first` / `current` URLs
  properties['url'] = {
    type: 'string',
    format: 'uri',
    description:
      'Absolute pagination URL (`next`, `first`, or `current` from a previous list response). When set, other filters are ignored.',
  }

  const schema: SchemaObjectRefLess = {
    type: 'object',
    properties,
  }

  const referenced: ReferencedSchemaObject = {
    originalName,
    typeName: originalName,
    description,
    schema,
  }
  acc.set(originalName, referenced)
  return referenced
}
