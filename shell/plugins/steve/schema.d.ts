
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
  /**
   * API group, '' for the core group
   */
  group?: string,
  /**
   * Plural resource name, as used in RBAC rules
   */
  resource?: string,
}

/**
 * Interface for a steve schema, represents raw json
 *
 * At some point this will be properly typed, until then...
 */
export interface Schema {
  id: string,
  attributes: SchemaAttribute
  /**
   * Methods the user can use on a resource of this type (e.g. GET, PUT, DELETE), from their own access
   */
  resourceMethods?: string[],
  /**
   * Methods the user can use on the type's collection (GET to list, POST to create), from their own access
   */
  collectionMethods?: string[],
}
