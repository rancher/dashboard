import { DSL } from '@/store/type-map';
import { HELM } from '@/config/types';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
  } = DSL(store, NAME);

  product({
    removable:  false,
    ifHaveType: HELM.RELEASE,
  });

  basicType([
    HELM.RELEASE
  ]);
}
