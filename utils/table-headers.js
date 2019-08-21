export const EXPAND = {
  name:   'expand',
  sort:   false,
  search: null,
  width:  30
};

export const STATE = {
  name:   'state',
  label:  'State',
  sort:   ['sortState', 'sortName', 'id'],
  search: 'displayState',
  width:  120
};

export const NAME = {
  name:      'name',
  value:     'displayName',
  label:     'Name',
  sort:      ['sortName', 'id'],
  formatter: 'LinkDetail',
};

export const NAMESPACE = {
  name:   'namespace',
  value:  'metadata.namespace',
  label:  'Namespace',
  sort:   ['metadata.namespace', 'id'],
};

export const CREATED = {
  name:       'created',
  value:      'metadata.creationTimestamp',
  label:      'Created',
  sort:       ['createdTs', 'id'],
  search:     false,
  width:      120,
  formatter:  'LiveDate',
  align:     'right'
};

export function headersFor(schema, multipleNamespaces = true) {
  const out = [];
  const namespaced = schema.attributes.namespaced;
  const columns = schema.attributes.columns;

  for ( const col of columns ) {
    if ( col.format === 'name' && col.field === 'metadata.name' ) {
      out.push(NAME);
      if ( namespaced && multipleNamespaces ) {
        out.push(NAMESPACE);
      }
    } else if ( col.format === 'date' && col.field === 'metadata.creationTimestamp' ) {
      out.push(CREATED);
    } else {
      out.push({
        name:  col.name.toLowerCase(),
        label: col.name,
        value: col.field,
        sort:  [col.field, 'id']
      });
    }
  }

  return out;
}
