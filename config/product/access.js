import { DSL } from '@/store/type-map';
import { MANAGEMENT, RBAC } from '@/config/types';

export const NAME = 'access';

export function init(store) {
  const {
    product,
    basicType,
  } = DSL(store, NAME);

  product({ inStore: 'management' });

  basicType([
    MANAGEMENT.USER,
    MANAGEMENT.GROUP,
    RBAC.CLUSTER_ROLE,
    RBAC.ROLE,
    RBAC.CLUSTER_ROLE_BINDING,
    RBAC.ROLE_BINDING,
  ]);
}
