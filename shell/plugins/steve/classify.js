import { lookup } from './model-loader';
import Resource from './resource-class';
import SteveModel from './steve-class';
import HybridModel from './hybrid-class';
import NormanModel from './norman-class';

export const NORMAN = 'norman';
export const BY_TYPE = 'byType';
export const STEVE = 'steve';

export const SELF = '__[[SELF]]__';

export function classify(ctx, obj, isClone = false) {
  if ( obj instanceof Resource ) {
    return obj;
  }

  let customModel = lookup(ctx.state.config.namespace, obj?.type, obj?.metadata?.name, ctx);

  if ( !customModel ) {
    const which = ctx.state.config.modelBaseClass || BY_TYPE;

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

  const out = new customModel(obj, ctx, (process.server ? ctx.state.config.namespace : null), isClone);

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
