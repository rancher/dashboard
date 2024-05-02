
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

export const COLUMN_BREAKPOINTS = {
  /**
   * Only show column if at tablet width or wider
   */
  TABLET:  'tablet',
  /**
   * Only show column if at laptop width or wider
   */
  LAPTOP:  'laptop',
  /**
   * Only show column if at desktop width or wider
   */
  DESKTOP: 'desktop'
};
