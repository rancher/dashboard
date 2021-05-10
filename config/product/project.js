import { DSL, IF_HAVE } from '@/store/type-map';

export const NAME = 'project';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
  } = DSL(store, NAME);

  product({
    weight:              98,
    ifHave:              'project',
    showNamespaceFilter: true,
  });

  virtualType({
    label:      'Monitoring',
    namespaced: true,
    name:       'project-monitoring',
    weight:     105,
    route:      { name: 'c-cluster-project' },
    exact:      true,
    overview:   false,
  });

  virtualType({
    label:      'Tools',
    namespaced: true,
    name:       'project-tools',
    weight:     105,
    route:      { name: 'c-cluster-project-tools' },
    exact:      true,
    overview:   false,
  });

  basicType([
    'project-monitoring',
    'project-tools',
  ]);

}
