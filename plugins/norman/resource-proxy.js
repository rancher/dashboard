import ResourceInstance from './resource-instance';

const models = [];

export function load() {
  const list = require.context('@/models', false, /.*\.js$/);

  list.keys().forEach((path) => {
    const impl = list(path);
    const filename = path.split('/').pop();
    const name = filename.split('.').slice(0, -1).join('.');

    models[name] = impl.default;
  });
}

load();

export function proxyFor(obj, dispatch) {
  // Attributes associated to the proxy, but not stored on the actual object
  let local;

  delete obj.__rehydrate;

  if ( process.server ) {
    Object.defineProperty(obj, '__rehydrate', {
      value:        true,
      enumerable:   true,
      configurable: true
    });
  }

  const proxy = new Proxy(obj, {
    get(target, name) {
      if ( name === '$dispatch' ) {
        return dispatch;
      } else if ( name === '_local' ) {
        if ( !local ) {
          local = {};
        }

        return local;
      }

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
