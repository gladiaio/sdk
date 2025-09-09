/**
 * OpenAPI Schema Types - Using official types from openapi3-ts
 */

import type { OpenAPIObject, ReferenceObject, SchemaObject } from 'openapi3-ts/oas31'

export type { OpenAPIObject, ReferenceObject, SchemaObject }

export type SchemaOrReference = SchemaObjectRefLess | ReferencedSchemaObject

export type ReferencedSchemaObject = {
  originalName: string
  typeName: string
  description?: string
  summary?: string
  schema: SchemaObjectRefLess
}

export type SchemaObjectRefLess = Omit<
  SchemaObject,
  | '$ref'
  | 'allOf'
  | 'oneOf'
  | 'anyOf'
  | 'not'
  | 'items'
  | 'properties'
  | 'additionalProperties'
  | 'propertyNames'
  | 'prefixItems'
> & {
  allOf?: SchemaOrReference[]
  oneOf?: SchemaOrReference[]
  anyOf?: SchemaOrReference[]
  not?: SchemaOrReference
  items?: SchemaOrReference
  properties?: { [propertyName: string]: SchemaOrReference }
  additionalProperties?: SchemaOrReference | boolean
  propertyNames?: SchemaOrReference
  prefixItems?: SchemaOrReference[]
}

export type LiveV2Schemas = {
  initRequest: ReferencedSchemaObject
  initResponse: ReferencedSchemaObject
  wsMessages: ReferencedSchemaObject[]
  callbackMessages: ReferencedSchemaObject[]
  webhookMessages: ReferencedSchemaObject[]
  referencedTypes: ReferencedSchemaObject[]
}
