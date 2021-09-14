import { lookup } from './model-loader';
import { Resource } from './resource-class';
import SteveModel from './steve-class';
import HybridModel from './hybrid-class';
import NormanModel from './norman-class';
import ResourceInstance from './resource-instance';

export const NORMAN = 'norman';
export const BY_TYPE = 'byType';
export const STEVE = 'steve';

export const SELF = '__[[SELF]]__';
export const ALREADY_A_PROXY = '__[[PROXY]]__';

const FAKE_CONSTRUCTOR = function() {};

FAKE_CONSTRUCTOR.toString = function() {
  return 'ResourceProxy';
};

const nativeProperties = ['description'];

export function proxyFor(ctx, obj, isClone = false) {
  if ( obj instanceof Resource || obj[ALREADY_A_PROXY] ) {
    return obj;
  }

  const mappedType = ctx.rootGetters['type-map/componentFor'](obj.type);
  let customModel = lookup(ctx.state.config.namespace, mappedType, obj?.metadata?.name);

  // Uncomment this to make everything a class by default instead of a proxy
  if ( !customModel ) {
    const which = ctx.state.config.modelBaseClass || STEVE;

    if ( which === BY_TYPE ) {
      if ( obj?.type?.startsWith('management.cattle.io.') || obj?.type?.startsWith('project.cattle.io.')) {
        customModel = HybridModel;
      } else {
        customModel = SteveModel;
      }
    } else if ( which === NORMAN ) {
      customModel = NormanModel;
    } else {
      customModel = SteveModel;
    }
  }

  let out;

  if ( customModel?.prototype ) {
    // If there's a new ES6 class model, return that and stop here
    out = new customModel(obj, ctx, (process.server ? ctx.state.config.namespace : null), isClone);
  } else {
    // Old Proxy-based models that will eventually go away
    const model = customModel || ResourceInstance;

    out = new Proxy(obj, {
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
          return fn.call(out);
        }

        return target[name];
      },
    });
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

  return out;
}
