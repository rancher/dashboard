
import Resource from './resource-class';

export const BY_TYPE = 'byType';

export const SELF = '__[[SELF]]__';

export function classify(ctx, obj, isClone = false) {
  if ( obj instanceof Resource ) {
    return obj;
  }

  const customModel = ctx.getters['classify'](obj);

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
