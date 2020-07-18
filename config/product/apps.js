import { DSL } from '@/store/type-map';
import { CATALOG } from '@/config/types';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
  } = DSL(store, NAME);

  product({
    removable:           false,
    showNamespaceFilter: true,
    ifHaveGroup:         'catalog.cattle.io'
  });

  basicType(CATALOG);
}
