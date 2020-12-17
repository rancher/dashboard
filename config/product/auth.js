import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { MANAGEMENT } from '@/config/types';

export const NAME = 'auth';

export function init(store) {
  const {
    product,
    basicType,
    // weightType,
    configureType,
    componentForType,
    // headers,
    // mapType,
    // virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          MANAGEMENT.USER,
    inStore:             'management',
    icon:                'user',
    removable:           false,
    weight:              -1,
    showClusterSwitcher: false,
  });

  // virtualType({
  //   label:       'Auth Providers',
  //   icon:        'lock',
  //   namespaced:  false,
  //   name:        'config',
  //   weight:      100,
  //   route:       { name: 'c-auth-config' },
  // });

  configureType(MANAGEMENT.AUTH_CONFIG, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
  });

  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/github`, 'auth/github');

  basicType([
    MANAGEMENT.AUTH_CONFIG,
    MANAGEMENT.USER,
    // MANAGEMENT.GROUP,
  ]);
}
