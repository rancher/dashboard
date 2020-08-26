import { DSL } from '@/store/type-map';

export const NAME = 'backup';
export const CHART_NAME = 'backup-restore';

export function init(store) {
  const {
    product,
    basicType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)*resources\.cattle\.io$/,
    icon:        'backup',
  });

  /*
  virtualType({
    label:       'Overview',
    group:      'Root',
    namespaced:  false,
    name:        'backup-overview',
    weight:      100,
    route:       { name: 'c-cluster-backup' },
    exact:       true,
  });
*/

  // basicType('backup-overview');

  basicType([
    'backups.resources.cattle.io',
    'resourcesets.resources.cattle.io',
    'restores.resources.cattle.io',
  ]);
}
