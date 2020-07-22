import { DSL } from '@/store/type-map';

export const NAME = 'logging';

export function init(store) {
  const {
    product,
    basicType,
  } = DSL(store, NAME);

  product({ ifHaveGroup: /^(.*\.)?logging\.banzaicloud\.io$/ });

  basicType([
    'logging.banzaicloud.io.logging',
    'logging.banzaicloud.io.common',
    'logging.banzaicloud.io.clusterflow',
    'logging.banzaicloud.io.clusteroutput',
    'logging.banzaicloud.io.flow',
    'logging.banzaicloud.io.output',
  ]);
}
