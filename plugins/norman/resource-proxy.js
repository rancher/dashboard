import ResourceInstance from './resource-instance';

const models = [];

export function load() {
  const list = require.context('@/models', false, /.*\.js$/);

  list.keys().forEach((fileName) => {
    const impl = list(fileName);
    const name = fileName.split('/').pop().split('.')[0];

    models[name] = impl.default;
  });
}

load();

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

      let fn;

      if ( models[target.type] && Object.prototype.hasOwnProperty.call(models[target.type], name) ) {
        fn = models[target.type][name];
      }

      if ( !fn ) {
        fn = ResourceInstance[name];
      }

      if ( fn ) {
        return fn.call(proxy);
      }

      return target[name];
    },
  });

  return proxy;
}
