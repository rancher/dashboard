export const STATE = {
  name:      'state',
  label:     'State',
  sort:      ['stateSort', 'nameSort', 'id'],
  value:     'stateDisplay',
  width:     90,
  default:   'unknown',
  formatter: 'BadgeState',
};

export const NAME = {
  name:      'name',
  label:     'Name',
  value:     'nameDisplay',
  sort:      ['nameSort', 'id'],
  formatter: 'LinkDetail',
};

export const NAMESPACE = {
  name:   'namespace',
  label:  'Namespace',
  value:  'metadata.namespace',
  sort:   ['metadata.namespace', 'nameSort', 'id'],
};

export const CREATED = {
  name:       'created',
  label:      'Created',
  value:      'metadata.creationTimestamp',
  sort:       ['createdTs', 'nameSort', 'id'],
  search:     false,
  width:      120,
  formatter:  'LiveDate',
  align:     'right'
};

export const RIO_IMAGE = {
  name:  'image',
  label: 'Image',
  value: 'imageDisplay',
  sort:  ['imageDisplay', 'nameSort', 'id'],
};

export const SCALE = {
  name:      'scale',
  label:     'Scale',
  value:     'scales.desired',
  sort:      ['scales.desired', 'nameSort', 'id'],
  width:     100,
  formatter: 'Scale',
  align:     'center',
};
export const WEIGHT = {
  name:      'weight',
  label:     'Weight',
  sort:      false,
  width:     60,
  align:     'center',
};

export const SUCCESS = {
  name:  'success',
  label: 'Success',
  value: 'success',
  width: 60,
  align: 'right',
};

export const REQ_RATE = {
  name:  'req-rate',
  label: 'Req Rate',
  value: 'rps',
  width: 60,
  align: 'right',
};

export const P95 = {
  name:  'p95',
  label: '95%tile',
  value: 'p95',
  width: 60,
  align: 'right',
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
