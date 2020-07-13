import { DSL } from '@/store/type-map';

export const NAME = 'access';

export function init(store) {
  const {
    alwaysProduct,
    // basicType,
  } = DSL(store, NAME);

  alwaysProduct();

  // basicType([
  // ]);
}
