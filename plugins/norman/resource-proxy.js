import ResourceInstance from './resource-instance';

export function proxyFor(obj, dispatch) {
  Object.defineProperty(obj, '$dispatch', { value: dispatch });

  if ( process.server ) {
    Object.defineProperty(obj, '__rehydrate', { value: true, enumerable: true });
  }

  const proxy = new Proxy(obj, {
    get(target, name) {
      if ( name === Symbol.toStringTag ) {
        name = 'toString';
      }

      const fn = ResourceInstance[name];

      if ( fn ) {
        return fn.call(proxy);
      }

      return target[name];
    },
  });

  return proxy;
}
