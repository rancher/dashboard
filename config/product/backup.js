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

  basicType([
    'backups.resources.cattle.io',
    'resourcesets.resources.cattle.io',
    'restores.resources.cattle.io',
  ]);
}
