
import Resource from './resource-class';

export const BY_TYPE = 'byType';

export const SELF = '__[[SELF]]__';

export function classify(ctx, obj, isClone = false) {
  if ( obj instanceof Resource ) {
    return obj;
  }

  const customModel = ctx.getters['classify'](obj);

  const out = new customModel(obj, ctx, null, isClone);

  return out;
}
