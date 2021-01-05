import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { MANAGEMENT } from '@/config/types';
import { REGISTER, _FLAGGED } from '@/config/query-params';

export const NAME = 'manager';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          MANAGEMENT.CLUSTER,
    inStore:             'management',
    icon:                'globe',
    weight:              -1,
    removable:           false,
    public:              false, // Hide from regular view during development
    showClusterSwitcher: false,
  });

  configureType(MANAGEMENT.CLUSTER, {
    extraListAction: {
      query:    { [REGISTER]: _FLAGGED },
      labelKey: 'generic.register',
    }
  });

  basicType([
    MANAGEMENT.CLUSTER,
  ]);

  basicType([
    MANAGEMENT.NODE_POOL,
    MANAGEMENT.NODE_TEMPLATE,
  ], 'Other Stuff');
}
