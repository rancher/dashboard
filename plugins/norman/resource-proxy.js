import ResourceInstance from './resource-instance';
import { lookup } from '@/utils/model';

export const SELF = '__[[SELF]]__';

export function proxyFor(ctx, obj, isClone = false) {
  // Attributes associated to the proxy, but not stored on the actual object
  let local;

  if ( obj.__isProxy ) {
    return obj;
  }

  if ( process.server ) {
    Object.defineProperty(obj, '__rehydrate', {
      value:        true,
      enumerable:   true,
      configurable: true
    });

    if ( isClone ) {
      Object.defineProperty(obj, '__clone', {
        value:        true,
        enumerable:   true,
        configurable: true,
        writable:     true
      });
    }
  }

  const model = lookup(obj.type) || ResourceInstance;

  const proxy = new Proxy(obj, {
    get(target, name) {
      if ( name === '__isProxy' ) {
        return true;
      } else if ( name === SELF ) {
        return obj;
      } else if ( name === Symbol.toStringTag ) {
        name = 'toString';
      } else if ( typeof name !== 'string' ) {
        return target[name];
      } else if ( name === '__proto__' ) {
        return function() {};
      }

      /*
      if ( name === '$constructor' ) {
        return model;
      } else if ( name === '$super' && model ) {
        return ResourceInstance;
      }
      */

      if ( name.startsWith('$') ) {
        return ctx[name.substr(1)];
      }

      if ( name === '_local' ) {
        if ( !local ) {
          local = {};
        }

        return local;
      }

      let fn;

      if ( model && Object.prototype.hasOwnProperty.call(model, name) ) {
        fn = model[name];
      }

      if ( !fn ) {
        fn = ResourceInstance[name];
      }

      if ( fn && fn.call ) {
        return fn.call(proxy);
      }

      return target[name];
    },

    getPrototypeOf() {
      return model;
    }
  });

  return proxy;
}
