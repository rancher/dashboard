import {
  STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, OBJECT,
  EVENT_LAST_SEEN_TIME,
  EVENT_TYPE
} from '@shell/config/table-headers';

// This file contains table headers
// These table headers are used for server side pagination
// They MUST contain sort and search values that are paths to raw properties (not computed properties in models)
// They SHOULD avoid formatters that change the value from the same used by sort and search (user will see an order that doesn't match what they see)

export const STEVE_NAME_COL = {
  ...NAME_COL,
  defaultSort: true,
  value:       'metadata.name',
  sort:        ['metadata.name'],
  search:      'metadata.name',
};

export const STEVE_ID_COL = {
  name:     'steve-id',
  labelKey: 'tableHeaders.id',
  value:    'id',
  sort:     ['id'],
  search:   'id',
};

export const STEVE_STATE_COL = {
  ...STATE,
  // Note, we're show the 'state' as per model, not the 'metadata.state.name' that's available in the model to remotely sort/filter
  // Need to investigate whether we should 'dumb down' the state we show to the native one (tracked via https://github.com/rancher/dashboard/issues/8527)
  // This means we'll show something different to what we sort and filter on.
  sort:   ['metadata.state.name'],
  search: 'metadata.state.name',
};

export const STEVE_AGE_COL = {
  ...AGE,
  value:  'metadata.creationTimestamp',
  sort:   'metadata.creationTimestamp',
  search: false,
};

export const STEVE_NAMESPACE_COL = {
  ...NAMESPACE_COL,
  value:  'metadata.namespace',
  sort:   'metadata.namespace',
  search: 'metadata.namespace',
};

export const STEVE_EVENT_OBJECT = {
  ...OBJECT,
  sort:   'involvedObject.kind',
  search: 'involvedObject.kind',
};

export const STEVE_EVENT_LAST_SEEN = {
  ...EVENT_LAST_SEEN_TIME,
  value: 'metadata.fields.0',
  sort:  'metadata.fields.0',
};

export const STEVE_EVENT_TYPE = {
  ...EVENT_TYPE,
  value: '_type',
  sort:  '_type',
};

export const STEVE_LIST_GROUPS = [{
  tooltipKey: 'resourceTable.groupBy.none',
  icon:       'icon-list-flat',
  value:      'none',
}, {
  icon:          'icon-folder',
  value:         'metadata.namespace',
  field:         'metadata.namespace', // Default groupByLabel field in models is NS based
  hideColumn:    NAMESPACE_COL.name,
  tooltipKey:    'resourceTable.groupBy.namespace',
  groupLabelKey: 'groupByLabel',
}];
