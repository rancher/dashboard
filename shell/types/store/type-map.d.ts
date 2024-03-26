
/**
 * interface for type-map's' definition for table headers/columns
 */
export interface TableColumn {
  name: string,
  label?: string,
  value: any,
  sort?: string | string[],
  formatter?: string,
  formatterOpts?: any,
  width?: number,
  tooltip?: string,
  search?: string | boolean,
}
