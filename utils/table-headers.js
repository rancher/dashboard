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
  name:   'name',
  value:  'displayName',
  label:  'Name',
  sort:   ['sortName', 'id'],
};

export const CREATED = {
  name:      'created',
  value:     'metadata.creationTimestamp',
  label:     'Created',
  sort:      ['createdTs', 'id'],
  search:    false,
  width:     120,
  formatter: 'LiveDate',
};
