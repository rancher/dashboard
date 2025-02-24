import { Schema, SchemaAttribute, SchemaAttributeColumn } from '@shell/plugins/steve/schema';
import { TableColumn } from '@shell/types/store/type-map';
import { VuexStoreGetters } from '@shell/types/store/vuex';
import { findBy, insertAt, removeObject } from '@shell/utils/array';
import { COUNT } from '@shell/config/types';
import { ActionFindAllArgs } from '@shell/types/store/dashboard-store.types';

const FIELD_REGEX = /^\$\.metadata\.fields\[([0-9]*)\]/;

type StoreColumns = { [schemaId: string]: TableColumn[]}

/**
 * Create the headers used in lists to show a resource
 *
 * These could be
 * - Pre-configured via the product (either non-paginated or paginated)
 * - Generated dynamically from schema's attributes.columns
 *
 * There's also some additional ones like state, age, and at least one of name or id
 *
 * The order of these are massaged as well
 */
export function createHeaders(
  ctx: {
    getters: VuexStoreGetters,
    rootGetters: VuexStoreGetters,
    state: any,
  },
  opt: {
    headers: StoreColumns,
    typeOptions: any,
    schema: any, // Once the schema-diet changes go in this can be typed
    columns: {
      /**
       * Always show this column (if showState is true)
       */
      state: TableColumn,
      /**
        * If dynamically creating columns, use specific column for name, if required
        */
      name?: TableColumn,
      /**
        * If dynamically creating columns, use specific column for id, if required
        */
      id?: TableColumn
      /**
        * If dynamically creating columns, use specific column for namespace, if required
        */
      namespace: TableColumn,
      /**
        * If dynamically creating columns, use specific column for age, if required
        */
      age: TableColumn,
    },
    pagination: boolean
  }): TableColumn[] {
  const {
    headers, typeOptions, schema, columns, pagination
  } = opt;
  const {
    state: stateColumn, name: nameColumn, namespace: namespaceColumn, id: idColumn, age: ageColumn
  } = columns;
  const { rootGetters } = ctx;
  const out = typeOptions.showState ? [stateColumn] : [];
  const attributes = (schema.attributes as SchemaAttribute) || {};
  const columnsFromSchema = attributes.columns || [];

  // A specific list has been provided
  if ( headers?.[schema.id]?.length ) {
    return headers[schema.id].map((entry: any) => {
      if ( typeof entry === 'string' ) {
        const col = findBy(columnsFromSchema, 'name', entry);

        if ( col ) {
          return headerFromSchemaCol(col, rootGetters, pagination, ageColumn);
        } else {
          return null;
        }
      } else {
        return entry;
      }
    }).filter((col: SchemaAttributeColumn) => !!col);
  }

  // Otherwise make one up from schema
  let hasName = false;
  const namespaced = attributes.namespaced || false;

  for ( const col of columnsFromSchema ) {
    if ( col.format === 'name' ) {
      hasName = true;
      out.push(nameColumn || headerFromSchemaCol(col, rootGetters, pagination, ageColumn));
      if ( namespaced ) {
        out.push(namespaceColumn);
      }
    } else {
      out.push(headerFromSchemaCol(col, rootGetters, pagination, ageColumn));
    }
  }

  // Always try to have an identifier
  if ( !hasName ) {
    insertAt(out, 1, idColumn || nameColumn);
    if ( namespaced ) {
      insertAt(out, 2, namespaceColumn);
    }
  }

  // Age always goes last
  const ageColumnActual = out.find((o) => o.name.toLocaleLowerCase() === 'age');

  if ( ageColumnActual ) {
    removeObject(out, ageColumnActual);
    if ( typeOptions.showAge ) {
      out.push(ageColumnActual);
    }
  }

  return out;
}

/**
 * Given a schema's attribute.column value create a header
 */
export function headerFromSchemaColString(colName: string, schema: Schema, rootGetters: VuexStoreGetters, pagination: boolean, ageColumn: TableColumn): TableColumn {
  if (!schema) {
    throw new Error(`Unable to create header for column '${ colName }' from schema: schema is missing`);
  }

  const col = schema.attributes.columns.find((c) => c.name === colName);

  if (!col) {
    throw new Error(`Unable to find column '${ colName }' in schema '${ schema.id }'`);
  }

  return headerFromSchemaCol(col, rootGetters, pagination, ageColumn);
}

/**
 * Given a schema's attribute.column value create a header
 */
export function headerFromSchemaCol(col: SchemaAttributeColumn, rootGetters: VuexStoreGetters, pagination: boolean, ageColumn: TableColumn): TableColumn {
  let formatter, width, formatterOpts;

  if ( (col.format === '' || col.format === 'date') && col.name === 'Age' && ageColumn ) {
    return ageColumn;
  }

  if ( col.format === 'date' || col.type === 'date' ) {
    formatter = 'Date';
    width = 120;
    formatterOpts = { multiline: true };
  }

  if ( col.type === 'number' || col.type === 'int' ) {
    formatter = 'Number';
  }

  const colName = col.name.includes(' ') ? col.name.split(' ').map((word) => word.charAt(0).toUpperCase() + word.substring(1) ).join('') : col.name;

  const exists = rootGetters['i18n/exists'];
  const t = rootGetters['i18n/t'];
  const labelKey = `tableHeaders.${ colName.charAt(0).toLowerCase() + colName.slice(1) }`;
  const description = col.description || '';
  const tooltip = description && description[description.length - 1] === '.' ? description.slice(0, -1) : description;

  const path = rowValueGetter(col, false) as string;
  // If we're not paginating use a function to get the value, otherwise use the string path
  const altPath = pagination ? path : rowValueGetter(col, true) as Function;

  return {
    name:   col.name.toLowerCase(),
    label:  exists(labelKey) ? t(labelKey) : col.name,
    value:  altPath,
    sort:   [path],
    search: path,
    formatter,
    formatterOpts,
    width,
    tooltip
  };
}

export function rowValueGetter(col: SchemaAttributeColumn, asFn = true): string | ((row: any) => string) {
  // 'field' comes from the schema - typically it is of the form $.metadata.field[N]
  // We will use JsonPath to look up this value, which is costly - so if we can detect this format
  // Use a more efficient function to get the value
  const value = col.field.startsWith('.') ? `$${ col.field }` : col.field;
  const found = value.match(FIELD_REGEX);

  if (found && found.length === 2) {
    const fieldIndex = parseInt(found[1], 10);

    if (asFn) {
      return (row: any) => row.metadata?.fields?.[fieldIndex];
    }

    return `metadata.fields.${ fieldIndex }`;
  }

  return value;
}

type conditionalDepaginateArgs ={
  ctx: { rootGetters: VuexStoreGetters},
  args: { type: string, opt: ActionFindAllArgs},
};
type conditionalDepaginateFn = (args: conditionalDepaginateArgs) => boolean

/**
 * Conditionally determine if a resource should use naive kube pagination api to fetch all results
 * (not just first page)
 */
export const conditionalDepaginate = (
  depaginate?: conditionalDepaginateFn | boolean,
  depaginateArgs?: conditionalDepaginateArgs
): boolean => {
  if (typeof depaginate === 'function') {
    return !!depaginateArgs ? depaginate(depaginateArgs) : false;
  }

  return depaginate as boolean;
};

/**
 * Setup a function that will determine if a resource should use native kube pagination api to fetch all resources
 * (not just the first page)
 */
export const configureConditionalDepaginate = (
  { maxResourceCount, isNorman = false }: { maxResourceCount: number, isNorman: boolean },
): conditionalDepaginateFn => {
  return (fnArgs: conditionalDepaginateArgs ): boolean => {
    const { rootGetters } = fnArgs.ctx;
    const { type } = fnArgs.args;
    const safeType = isNorman ? `management.cattle.io.${ type }` : type;

    const inStore = rootGetters['currentStore'](safeType);
    const resourceCounts = rootGetters[`${ inStore }/all`](COUNT)[0]?.counts[safeType];
    const resourceCount = resourceCounts?.summary?.count;

    return resourceCount !== undefined ? resourceCount < maxResourceCount : false;
  };
};
