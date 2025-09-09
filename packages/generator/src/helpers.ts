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
