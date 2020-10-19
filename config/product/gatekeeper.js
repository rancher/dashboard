import { DSL } from '@/store/type-map';
import { GATEKEEPER } from '@/config/types';
import { AGE, NAME as NAME_COL, STATE } from '@/config/table-headers';

export const NAME = 'gatekeeper';
export const CHART_NAME = 'rancher-gatekeeper';

export function init(store) {
  const {
    product,
    basicType,
    componentForType,
    headers,
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
  mapType(/^templates\.gatekeeper\.sh\.constrainttemplate$/, 'Template');
  mapType(/^constraints\.gatekeeper\.sh\..*$/, 'Constraints');

  basicType([
    'gatekeeper-overview',
    'gatekeeper-constraint',
    'gatekeeper-template',
    GATEKEEPER.CONSTRAINT_TEMPLATE
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
    weight:     2
  });

  headers(GATEKEEPER.CONSTRAINT_TEMPLATE, [
    STATE,
    NAME_COL,
    {
      name:  'Kind',
      label: 'Kind',
      value: 'kind',
      sort:  'kind'
    },
    AGE,
  ]);
}
