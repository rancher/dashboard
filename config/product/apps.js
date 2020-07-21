import { DSL } from '@/store/type-map';
import { CATALOG } from '@/config/types';
import { NAMESPACE_NAME, CHART, RESOURCES, AGE } from '@/config/table-headers';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    formOnlyType
  } = DSL(store, NAME);

  product({
    removable:           false,
    showNamespaceFilter: true,
    ifHaveGroup:         'catalog.cattle.io'
  });

  basicType([
    CATALOG.REPO,
    CATALOG.CLUSTER_REPO,
    CATALOG.RELEASE
  ]);

  formOnlyType(CATALOG.RELEASE);

  headers(CATALOG.RELEASE, [NAMESPACE_NAME, CHART, RESOURCES, AGE]);
}
