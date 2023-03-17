export function _getLastSeen(resource, { schemaFor, rowValueGetter }) {
  const schema = schemaFor(resource.type);

  return schema && rowValueGetter ? rowValueGetter(schema, 'Last Seen')(resource) : null;
}

export function _getEventType(resource) {
  return resource._type;
}

export const calculatedFields = [
  { name: 'lastSeen', func: _getLastSeen },
  { name: 'eventType', func: _getEventType }
];
