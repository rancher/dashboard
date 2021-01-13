import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { CAPI, MANAGEMENT } from '@/config/types';
import { REGISTER, _FLAGGED } from '@/config/query-params';

export const NAME = 'manager';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          CAPI.CAPI_CLUSTER,
    inStore:             'management',
    icon:                'globe',
    weight:              -1,
    removable:           false,
    public:              false, // Hide from regular view during development
    showClusterSwitcher: false,
  });

  configureType(CAPI.CAPI_CLUSTER, {
    extraListAction: {
      query:    { [REGISTER]: _FLAGGED },
      labelKey: 'generic.register',
    }
  });

  basicType([
    CAPI.CAPI_CLUSTER,
  ]);

  basicType([
    CAPI.RKE_CLUSTER,
    MANAGEMENT.CLUSTER,
  ], 'Other stuff for now');

  basicType([
    'node-config.cattle.io.amazonec2config',
    'node-config.cattle.io.digitaloceanconfig'
  ], 'Node Configs');
}
