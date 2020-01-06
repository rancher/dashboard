// Note: 'id' is always the last sort, so you don't have to specify it here.

export const STATE = {
  name:      'state',
  label:     'State',
  sort:      ['stateSort', 'nameSort'],
  value:     'stateDisplay',
  width:     75,
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

export const NAMESPACE_NAME_IMAGE = {
  name:      'namespace-name-image',
  label:     'Name',
  value:     'namespaceNameDisplay',
  sort:      ['namespaceNameSort'],
  formatter: 'LinkDetailImage',
};

export const NAME_IMAGE = {
  name:      '-name-image',
  label:     'Name',
  value:     'nameDisplay',
  sort:      ['nameSort'],
  formatter: 'LinkDetailImage',
};

/*
export const NAMESPACE = {
  name:   'namespace',
  label:  'Namespace',
  value:  'metadata.namespace',
  sort:   ['metadata.namespace', 'nameSort'],
};
*/

export const NODE = {
  name:  'node',
  label: 'Node',
  value: 'spec.nodeName',
};

export const NODE_NAME = {
  name:      'nodeName',
  label:     'Name',
  sort:      'name',
  value:     'name',
  formatter: 'LinkDetail',
};

export const ROLES = {
  name:  'roles',
  label: 'Roles',
  sort:  'roles',
  value: 'roles'
};

export const VERSION = {
  name:  'version',
  label: 'Version',
  sort:  'version',
  value: 'version'
};

export const CPU = {
  name:      'cpu',
  label:     'CPU',
  sort:      'cpu',
  value:     'cpuUsage',
  formatter: 'PercentageBar'
};

export const RAM = {
  name:      'ram',
  label:     'RAM',
  sort:      'ram',
  value:     'ramUsage',
  formatter: 'PercentageBar'
};

export const PODS = {
  name:      'pods',
  label:     'Pods',
  sort:      'pods',
  value:     'podUsage',
  formatter: 'PercentageBar'
};

export const AGE = {
  name:       'age',
  label:      'Age',
  value:      'metadata.creationTimestamp',
  sort:       ['createdTs', 'nameSort'],
  search:     false,
  formatter:  'LiveDate',
  width:      75,
  align:     'right'
};

export const RIO_IMAGE = {
  name:  'image',
  label: 'Image',
  value: 'imageDisplay',
  sort:  ['imageDisplay', 'nameSort'],
};

export const POD_IMAGES = {
  name:      'pod_images',
  label:     'Images',
  value:     'status.containerStatuses',
  formatter: 'PodImages'
};

export const ENDPOINTS = {
  name:      'endpoint',
  label:     'Endpoint',
  value:     'status.endpoints',
  formatter: 'Endpoints',
  width:      60,
  align:     'center',
};

export const SCALE = {
  name:      'scale',
  label:     'Scale',
  value:     'scales.desired',
  sort:      ['scales.desired', 'nameSort'],
  formatter: 'Scale',
  width:     60,
  align:     'center',
};

export const WEIGHT = {
  name:      'weight',
  label:     'Weight',
  value:     'status.computedWeight',
  sort:      'status.computedWeight',
  formatter: 'Weight',
  width:     60,
  align:     'center',
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

export const MATCHES = {
  name:      'matches',
  label:     'Matches',
  value:     'spec.routes',
  formatter: 'RouterMatch'
};

export const DESTINATION = {
  name:      'destination',
  label:     'Target',
  value:     'spec.routes',
  formatter: 'RouterDestination'
};

export const USERNAME = {
  name:  'username',
  label: 'Username',
  value: 'username'
};

export const USER_DISPLAY_NAME = {
  name:  'display name',
  label: 'Display Name',
  value: 'name'
};

export const USER_ID = {
  name:  'user-id',
  label: 'ID',
  value: 'id'
};

export const USER_STATUS = {
  name:      'user-state',
  label:     'Status',
  value:     'stateDisplay',
  formatter: 'BadgeState'
};

export const TYPE = {
  name:  'type',
  label: 'Type',
  value: 'type',
  sort:  ['type']
};
export const STATUS = {
  name:  'status',
  label: 'Status',
  value: 'status',
  sort:  ['status']
};
export const LAST_HEARTBEAT_TIME = {
  name:      'lastHeartbeatTime',
  label:     'Last update',
  value:     'lastHeartbeatTime',
  sort:      ['lastHeartbeatTime'],
  formatter:  'LiveDate',
};
export const REASON = {
  name:  'reason',
  label: 'Reason',
  value: 'reason',
  sort:  ['reason']
};
export const MESSAGE = {
  name:  'message',
  label: 'Message',
  value: 'message',
  sort:  ['message']
};
export const KEY = {
  name:  'key',
  label: 'Key',
  value: 'key',
  sort:  ['key']
};
export const VALUE = {
  name:  'value',
  label: 'Value',
  value: 'value',
  sort:  ['value']
};
export function headersFor(schema) {
  const out = [];
  const attributes = schema.attributes || {};
  const columns = attributes.columns;
  const namespaced = attributes.namespaced;

  let hasName = false;

  for ( const col of columns ) {
    if ( col.format === 'name' && col.field === 'metadata.name' ) {
      hasName = true;
      out.push(namespaced ? NAMESPACE_NAME : NAME);
    } else if ( col.format === 'date' && col.field === 'metadata.creationTimestamp' ) {
      out.push(AGE);
    } else {
      let formatter, width;

      if ( col.format === 'date' || col.type === 'date' ) {
        formatter = 'Date';
        width = 120;
      }

      out.push({
        name:  col.name.toLowerCase(),
        label: col.name,
        value: col.field.startsWith('.') ? `$${ col.field }` : col.field,
        sort:  [col.field],
        formatter,
        width,
      });
    }
  }

  if ( !hasName ) {
    out.unshift(namespaced ? NAMESPACE_NAME : NAME);
  }

  return out;
}
