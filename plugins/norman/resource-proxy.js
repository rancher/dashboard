import ResourceInstance from './resource-instance';

export function proxyFor(obj, dispatch) {
  Object.defineProperty(obj, '$dispatch', { value: dispatch });

  if ( process.server ) {
    Object.defineProperty(obj, '__rehydrate', { value: true, enumerable: true });
  }

  return new Proxy(obj, {
    get(target, name) {
      if ( name === Symbol.toStringTag ) {
        name = 'toString';
      }

      const fn = ResourceInstance[name];

      if ( fn ) {
        return fn.call(target);
      }

      return target[name];
    },
  });
}
