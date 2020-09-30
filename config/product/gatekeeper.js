import { DSL } from '@/store/type-map';
import { GATEKEEPER } from '@/config/types';

export const NAME = 'gatekeeper';
export const CHART_NAME = 'rancher-gatekeeper';

export function init(store) {
  const {
    product,
    basicType,
    componentForType,
    // ignoreGroup,
    mapGroup,
    mapType,
    virtualType
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)?gatekeeper\.sh$/,
    icon:        'gatekeeper',
  });

  mapGroup(/^(.*\.)?gatekeeper\.sh$/, 'OPA Gatekeeper');

  componentForType(/^constraints\.gatekeeper\.sh\..*$/, 'gatekeeper-constraint');
  mapType(/^constraints\.gatekeeper\.sh\..*$/, 'Constraint');

  basicType([
    'gatekeeper-overview',
    'gatekeeper-constraint',
    'gatekeeper-template',
  ]);

  virtualType({
    label:      'Overview',
    namespaced: false,
    name:       'gatekeeper-overview',
    route:      { name: 'c-cluster-gatekeeper' },
    exact:      true,
    weight:     3
  });

  virtualType({
    label:      'Constraint',
    namespaced: false,
    name:       'gatekeeper-constraint',
    route:      { name: 'c-cluster-gatekeeper-constraints' },
    ifHaveType: GATEKEEPER.CONSTRAINT_TEMPLATE,
    weight:     2
  });

  virtualType({
    label:      'Template',
    namespaced: false,
    name:       'gatekeeper-template',
    route:      { name: 'c-cluster-gatekeeper-templates' },
    ifHaveType: GATEKEEPER.CONSTRAINT_TEMPLATE,
    weight:     1
  });
}
