
export interface SchemaAttributeColumn {
  description: string,
  field: string,
  format: string,
  name: string,
  priority: number,
  type: string,
}

export type SchemaAttributeVerbs = 'get' | 'patch' | 'list' | 'update'

export interface SchemaAttribute {
  columns: SchemaAttributeColumn[],
  namespaced: boolean
  verbs: SchemaAttributeVerbs[]
}

/**
 * Interface for a steve schema, represents raw json
 *
 * At some point this will be properly typed, until then...
 */
export interface Schema {
  id: string,
  attributes: SchemaAttribute
}
