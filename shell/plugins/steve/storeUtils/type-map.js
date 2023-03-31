import { applyMapping, labelForDefaultFn } from '@shell/utils/type-map';
import { findBy } from '@shell/utils/array';

const FIELD_REGEX = /^\$\.metadata\.fields\[([0-9]*)\]/;

export function _findColumnByName(schema, colName) {
  const attributes = schema.attributes || {};
  const columns = attributes.columns || [];

  return findBy(columns, 'name', colName);
}

export function _rowValueGetter(col) {
  // 'field' comes from the schema - typically it is of the form $.metadata.field[N]
  // We will use JsonPath to look up this value, which is costly - so if we can detect this format
  // Use a more efficient function to get the value
  const value = col.field.startsWith('.') ? `$${ col.field }` : col.field;

  if (process.client) {
    const found = value.match(FIELD_REGEX);

    if (found && found.length === 2) {
      const fieldIndex = parseInt(found[1], 10);

      return row => row.metadata?.fields?.[fieldIndex];
    }
  }

  return value;
}

export const labelFor = (state, _, __, rootGetters) => {
  const translate = rootGetters['i18n/translate'];
  const exists = rootGetters['i18n/exists'];

  return (schema, count, language) => {
    return applyMapping(
      schema,
      state.typeMappings,
      'id',
      false,
      labelForDefaultFn(schema, count, language, { translate, exists })
    );
  };
};
