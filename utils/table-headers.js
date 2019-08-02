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
  label:  'Name',
  sort:   ['sortName', 'id'],
  search: 'displayName',
};

export const CREATED = {
  name:   'created',
  label:  'Created',
  sort:   ['createdTs', 'id'],
  search: 'created',
  width:  120,
};
