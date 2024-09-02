
export interface SchemaAttributeColumn {
  description: string,
  field: string,
  format: string,
  name: string,
  priority: number,
  type: string,
}

export interface SchemaAttribute {
  columns: SchemaAttributeColumn[],
  namespaced: boolean
}

/**
 * At some point this will be properly typed, until then...
 */
export interface Schema {
  id: string,
  attributes: SchemaAttribute
}
