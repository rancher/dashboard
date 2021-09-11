import { lookup } from './model-loader';
import { Resource } from './resource-class';
import ResourceInstance from './resource-instance';

export const SELF = '__[[SELF]]__';
export const ALREADY_A_PROXY = '__[[PROXY]]__';

const FAKE_CONSTRUCTOR = function() {};

FAKE_CONSTRUCTOR.toString = function() {
  return 'ResourceProxy';
};

const nativeProperties = ['description'];

export function proxyFor(ctx, obj, isClone = false) {
  if ( obj[ALREADY_A_PROXY] || obj instanceof Resource ) {
    return obj;
  }

  remapSpecialKeys(obj);

  const mappedType = ctx.rootGetters['type-map/componentFor'](obj.type);
  let customModel = lookup(ctx.state.config.namespace, mappedType, obj?.metadata?.name);

  if ( !customModel ) {
    customModel = Resource;
  }

  if ( customModel?.prototype ) {
    const out = new customModel(obj, ctx, (process.server ? ctx.state.config.namespace : null), isClone);

    return out;
  }

  if ( process.server ) {
    Object.defineProperty(obj, '__rehydrate', {
      value:        ctx.state.config.namespace,
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

  const model = customModel || ResourceInstance;

  const proxy = new Proxy(obj, {
    get(target, name) {
      if ( name === ALREADY_A_PROXY ) {
        return true;
      } else if ( name === SELF ) {
        return obj;
      } else if ( name === Symbol.toStringTag ) {
        name = 'toString';
      } else if ( typeof name !== 'string' ) {
        return target[name];
      } else if ( name === 'constructor' ) {
        // To satisfy vue-devtools
        return FAKE_CONSTRUCTOR;
      } else if ( name === '$ctx' ) {
        return ctx;
      } else if ( name.startsWith('$') ) {
        return ctx[name.substr(1)];
      }

      let fn;

      if ( customModel && Object.prototype.hasOwnProperty.call(customModel, name) ) {
        fn = model[name];
      } else if (nativeProperties.includes(name) && obj[name] !== undefined) {
        // If there's not a model specific override for this property check if it exists natively in the object... otherwise fall back on
        // the default resource instance property/fn. This ensures it's correctly stored over fetch/clone/etc and sent when persisted
        return obj[name];
      }

      if ( !fn ) {
        fn = ResourceInstance[name];
      }

      if ( fn && fn.call ) {
        return fn.call(proxy);
      }

      return target[name];
    },
  });

  return proxy;
}

export function remapSpecialKeys(obj) {
  // Hack for now, the resource-instance name() overwrites the model name.
  if ( obj.name ) {
    obj._name = obj.name;
    delete obj.name;
  }

  if ( obj.description ) {
    obj._description = obj.description;
    delete obj.description;
  }

  if ( obj.state ) {
    obj._state = obj.state;
    delete obj.state;
  }

  if ( obj.labels ) {
    obj._labels = obj.labels;
    delete obj.labels;
  }

  if ( obj.annotations ) {
    obj._annotations = obj.annotations;
    delete obj.annotations;
  }
}
