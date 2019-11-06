// Note: 'id' is always the last sort, so you don't have to specify it here.

export const STATE = {
  name:      'state',
  label:     'State',
  sort:      ['stateSort', 'nameSort'],
  value:     'stateDisplay',
  width:     90,
  default:   'unknown',
  formatter: 'BadgeState',
};

export const NAME = {
  name:      'name',
  label:     'Name',
  value:     'nameDisplay',
  sort:      ['nameSort'],
  formatter: 'LinkDetail',
};

export const NAME_UNLINKED = {
  name:      'name',
  label:     'Name',
  value:     'nameDisplay',
  sort:      ['nameSort'],
};

export const NAMESPACE_NAME_UNLINKED = {
  name:      'namespace-name',
  label:     'Name',
  value:     'namespaceNameDisplay',
  sort:      ['namespaceNameSort'],
};

export const NAMESPACE_NAME = {
  name:      'namespace-name',
  label:     'Name',
  value:     'namespaceNameDisplay',
  sort:      ['namespaceNameSort'],
  formatter: 'LinkDetail',
};

/*
export const NAMESPACE = {
  name:   'namespace',
  label:  'Namespace',
  value:  'metadata.namespace',
  sort:   ['metadata.namespace', 'nameSort'],
};
*/

export const AGE = {
  name:       'age',
  label:      'Age',
  value:      'metadata.creationTimestamp',
  sort:       ['createdTs', 'nameSort'],
  search:     false,
  width:      75,
  formatter:  'LiveDate',
  align:     'right'
};

export const RIO_IMAGE = {
  name:  'image',
  label: 'Image',
  value: 'imageDisplay',
  sort:  ['imageDisplay', 'nameSort'],
};

export const SCALE = {
  name:      'scale',
  label:     'Scale',
  value:     'scales.desired',
  sort:      ['scales.desired', 'nameSort'],
  width:     100,
  formatter: 'Scale',
  align:     'center',
};

export const WEIGHT = {
  name:      'weight',
  label:     'Weight',
  value:     'status.computedWeight',
  width:     100,
  align:     'center',
  formatter: 'Weight',
};

export const SUCCESS = {
  name:  'success',
  label: 'Success',
  value: 'success',
  width: 100,
  align: 'right',
};

export const REQ_RATE = {
  name:  'req-rate',
  label: 'Req Rate',
  value: 'rps',
  width: 100,
  align: 'right',
};

export const P95 = {
  name:  'p95',
  label: '95%tile',
  value: 'p95',
  width: 100,
  align: 'right',
};

export const KEYS = {
  name:      'keys',
  label:     'Keys',
  sort:      false,
  value:     'keysDisplay',
};

export const TARGET_KIND = {
  name:  'target-kind',
  label: 'Target Type',
  value: 'kindDisplay',
  width: 100,
};

export const TARGET = {
  name:  'target',
  label: 'Target',
  value: 'targetDisplay',
};

export function headersFor(schema) {
  const out = [];
  const columns = schema.attributes.columns;

  for ( const col of columns ) {
    if ( col.format === 'name' && col.field === 'metadata.name' ) {
      out.push(NAMESPACE_NAME);
    } else if ( col.format === 'date' && col.field === 'metadata.creationTimestamp' ) {
      out.push(AGE);
    } else {
      out.push({
        name:  col.name.toLowerCase(),
        label: col.name,
        value: col.field.replace(/^\./, ''),
        sort:  [col.field]
      });
    }
  }

  return out;
}
