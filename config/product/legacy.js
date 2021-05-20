import { LEGACY } from '@/store/features';
import { DSL } from '@/store/type-map';

export const NAME = 'legacy';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
  } = DSL(store, NAME);

  product({
    weight:              80,
    ifFeature:           LEGACY,
    showNamespaceFilter: true,
  });

  virtualType({
    label:          'Alerts',
    name:           'v1-alerts',
    group:          'Root',
    namespaced:     true,
    weight:         111,
    icon:           'folder',
    route:          { name: 'c-cluster-legacy-pages-page', params: { page: 'alerts' } },
    exact:          true
  });

  virtualType({
    label:          'Catalogs',
    name:           'v1-catalogs',
    group:          'Root',
    namespaced:     true,
    weight:         111,
    icon:           'folder',
    route:          { name: 'c-cluster-legacy-pages-page', params: { page: 'catalogs' } },
    exact:          true
  });

  virtualType({
    label:          'Notifiers',
    name:           'v1-notifiers',
    group:          'Root',
    namespaced:     true,
    weight:         111,
    icon:           'folder',
    route:          { name: 'c-cluster-legacy-pages-page', params: { page: 'notifiers' } },
    exact:          true
  });

  virtualType({
    ifHave:     'project',
    label:      'Project',
    namespaced: true,
    name:       'v1-project',
    weight:     105,
    icon:       'folder',
    route:      { name: 'c-cluster-project-apps' },
    exact:      true,
    overview:   false,
  });

  virtualType({
    ifHave:     'no-project',
    label:      'Project',
    namespaced: true,
    name:       'v1-project-overview',
    weight:     105,
    icon:       'folder',
    route:      { name: 'c-cluster-legacy-project' },
    exact:      true,
    overview:   false,
  });

  basicType([
    'v1-alerts',
    'v1-catalogs',
    'v1-notifiers',
    'v1-project-overview'
  ]);

  // Project Pages

  virtualType({
    ifHave:     'project',
    label:      'Alerts',
    namespaced: true,
    name:       'project-alerts',
    weight:     105,
    route:      { name: 'c-cluster-legacy-project-page', params: { page: 'alerts' } },
    exact:      true,
    overview:   false,
  });

  virtualType({
    ifHave:     'project',
    label:      'Apps',
    namespaced: true,
    name:       'project-apps',
    weight:     110,
    route:      { name: 'c-cluster-legacy-project-page', params: { page: 'apps' } },
    exact:      true,
    overview:   false,
  });

  virtualType({
    ifHave:     'project',
    label:      'Catalogs',
    namespaced: true,
    name:       'project-catalogs',
    weight:     105,
    route:      { name: 'c-cluster-legacy-project-page', params: { page: 'catalogs' } },
    exact:      true,
    overview:   false,
  });

  virtualType({
    ifHave:     'project',
    label:      'Logging',
    namespaced: true,
    name:       'project-logging',
    weight:     105,
    route:      { name: 'c-cluster-legacy-project-page', params: { page: 'logging' } },
    exact:      true,
    overview:   false,
  });

  virtualType({
    ifHave:     'project',
    label:      'Monitoring',
    namespaced: true,
    name:       'project-monitoring',
    weight:     105,
    route:      { name: 'c-cluster-legacy-project-page', params: { page: 'monitoring' } },
    exact:      true,
    overview:   false,
  });

  basicType([
    'project-apps',
    'project-alerts',
    'project-catalogs',
    'project-logging',
    'project-monitoring',
  ], 'Project');
}
