export function _getLastSeen(resource, getters, rootGetters) {
  const schema = getters['schemaFor'](resource.type);
  const rowValueGetter = rootGetters['type-map/rowValueGetter'];

  return schema && rowValueGetter ? rowValueGetter(schema, 'Last Seen')(resource) : null;
}

export function _getEventType(resource) {
  return resource._type;
}

export const calculatedFields = [
  { name: 'lastSeen', func: _getLastSeen },
  { name: 'eventType', func: _getEventType }
];
