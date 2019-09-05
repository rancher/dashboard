export const EXPAND = {
  name:   'expand',
  sort:   false,
  search: null,
  width:  30
};

export const STATE = {
  name:    'state',
  label:   'State',
  sort:    ['sortState', 'sortName', 'id'],
  search:  'displayState',
  width:   120,
  default: 'unknown',
};

export const NAME = {
  name:      'name',
  label:     'Name',
  value:     'displayName',
  sort:      ['sortName', 'id'],
  formatter: 'LinkDetail',
};

export const NAMESPACE = {
  name:   'namespace',
  label:  'Namespace',
  value:  'metadata.namespace',
  sort:   ['metadata.namespace', 'sortName', 'id'],
};

export const CREATED = {
  name:       'created',
  label:      'Created',
  value:      'metadata.creationTimestamp',
  sort:       ['createdTs', 'sortName', 'id'],
  search:     false,
  width:      120,
  formatter:  'LiveDate',
  align:     'right'
};

export const RIO_IMAGE = {
  name:  'image',
  label: 'Image',
  value: 'displayImage',
  sort:  ['displayImage', 'sortName', 'id'],
};

export const SCALE = {
  name:      'scale',
  label:     'Scale',
  value:     'scales.desired',
  sort:      ['scales.desired', 'sortName', 'id'],
  width:     100,
  formatter: 'Scale',
  align:     'center',
};

export function headersFor(schema, addNamespace = true) {
  const out = [];
  const columns = schema.attributes.columns;

  for ( const col of columns ) {
    if ( col.format === 'name' && col.field === 'metadata.name' ) {
      out.push(NAME);
      if ( addNamespace ) {
        out.push(NAMESPACE);
      }
    } else if ( col.format === 'date' && col.field === 'metadata.creationTimestamp' ) {
      out.push(CREATED);
    } else {
      out.push({
        name:  col.name.toLowerCase(),
        label: col.name,
        value: col.field.replace(/^\./, ''),
        sort:  [col.field, 'id']
      });
    }
  }

  return out;
}
