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
