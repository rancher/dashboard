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

export const DOWNLOAD = {
  name:          'download',
  label:         'Download',
  value:         'download',
  canBeVariable: true,
  align:         'right',
};

export const NAME = {
  name:          'name',
  label:         'Name',
  value:         'nameDisplay',
  sort:          ['nameSort'],
  formatter:     'LinkDetail',
  width:         200,
  canBeVariable: true,
};

export const NAME_UNLINKED = {
  name:          'name',
  label:         'Name',
  value:         'nameDisplay',
  sort:          ['nameSort'],
  canBeVariable: true,
};

export const NAMESPACE_NAME_UNLINKED = {
  name:          'name',
  label:         'Name',
  value:         'namespacedName',
  sort:          ['namespacedNameSort'],
  canBeVariable: true,
};

export const NAMESPACE_NAME = {
  name:          'name',
  label:         'Name',
  value:         'namespacedName',
  sort:          ['namespacedNameSort'],
  formatter:     'LinkDetail',
  canBeVariable: true,
};

export const NODE = {
  name:      'node',
  label:     'Node',
  value:     'spec.nodeName',
  sort:      'spec.nodeName',
  formatter: 'LinkNode'
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
  sort:       'metadata.creationTimestamp',
  search:     false,
  formatter:  'LiveDate',
  width:      75,
  align:     'right'
};

export const IMAGE = {
  name:  'image',
  label: 'Image',
  value: 'image',
  sort:  ['image', 'nameSort'],
};

export const RIO_IMAGE = {
  name:  'image',
  label: 'Image',
  value: 'imageDisplay',
  sort:  ['imageDisplay', 'nameSort'],
};

export const POD_IMAGES = {
  name:      'pod_images',
  label:     'Image',
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

export const SIMPLE_SCALE = {
  name:      'simple-scale',
  label:     'Scale',
  value:     'scale',
  sort:      ['scale']
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
  label:     'Detail',
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
  value: 'typeDisplay',
  sort:  ['typeDisplay'],
  width: 100,
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
  name:      'value',
  label:     'Value',
  value:     'value',
  sort:      ['value'],
  formatter: 'ClickExpand'
};

export const BUILT_IN = {
  name:      'builtIn',
  label:     'Built In',
  value:     'builtIn',
  sort:      ['builtIn'],
  align:     'center',
  formatter: 'IconIsDefault'
};

export const CLUSTER_CREATOR_DEFAULT = {
  name:      'default',
  label:     'Cluster Creator Default',
  value:     'default',
  sort:      ['Default'],
  align:     'center',
  formatter:  'IconIsDefault'
};

export const RBAC_HEADERS = [
  {
    name:      'create',
    label:     'Create',
    value:     'create',
    align:     'center',
    formatter: 'IconIsDefault',
  },
  {
    name:      'delete',
    label:     'Delete',
    value:     'delete',
    align:     'center',
    formatter: 'IconIsDefault',
  },
  {
    name:      'get',
    label:     'Get',
    value:     'get',
    align:     'center',
    formatter: 'IconIsDefault',
  },
  {
    name:      'list',
    label:     'List',
    value:     'list',
    align:     'center',
    formatter: 'IconIsDefault',
  },
  {
    name:      'patch',
    label:     'Patch',
    value:     'patch',
    align:     'center',
    formatter: 'IconIsDefault',
  },
  {
    name:      'update',
    label:     'Update',
    value:     'update',
    align:     'center',
    formatter: 'IconIsDefault',
  },
  {
    name:      'watch',
    label:     'Watch',
    value:     'watch',
    align:     'center',
    formatter: 'IconIsDefault',
  }
];

export const RESOURCE = {
  name:  'resource',
  label: 'Resource',
  value: 'resource',
  sort:  ['resourceNames']
};

export const API_GROUP = {
  name:  'apigroups',
  label: 'API Groups',
  value: 'apiGroups',
  sort:  ['apiGroups']
};

export const INGRESS_TARGET = {
  name:      'ingressTarget',
  label:     'Target',
  value:     "$['spec']['rules'][0]",
  formatter: 'IngressTarget',
  sort:      "$['spec']['rules'][0].host",
}
;
