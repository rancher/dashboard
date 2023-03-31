import { getSecondsDiff } from '@shell/utils/time';

export function _getDuration(resource, getters, rootGetters) {
  const schema = getters['schemaFor'](resource.type);
  const rowValueGetter = rootGetters['type-map/rowValueGetter'];

  const { completionTime, startTime } = resource.status;

  const staticValue = schema && rowValueGetter ? rowValueGetter(schema, 'Duration')(resource) : null;
  const seconds = staticValue && startTime ? getSecondsDiff(startTime, completionTime || new Date()) : 0;

  return {
    value: completionTime ? { staticValue } : { startTime },
    seconds,
  };
}

export const calculatedFields = [
  {
    name: 'duration', func: _getDuration, caches: ['type-map']
  },
];
