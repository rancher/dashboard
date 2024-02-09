import { STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

// These contain paths set to specific values within a resource returned by the server
// In the future specific resource types will extend these with their own definitions
// For tidyness that should be done alongside their models

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
  // value:  'metadata.state.name', Use the state as defined by the resource rather than converted via the model.
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
