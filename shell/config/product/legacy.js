import { LEGACY } from '@shell/store/features';
import { DSL, IF_HAVE } from '@shell/store/type-map';

export const NAME = 'legacy';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
    setGroupDefaultType,
  } = DSL(store, NAME);

  product({
    weight:              80,
    ifFeature:           LEGACY,
    showNamespaceFilter: true,
  });

  virtualType({
    ifHave:     IF_HAVE.NO_PROJECT,
    labelKey:   'legacy.project.label',
    namespaced: true,
    name:       'v1-project-overview',
    weight:     105,
    route:      { name: 'c-cluster-legacy-project' },
    exact:      true,
    overview:   false,
  });

  basicType(['v1-project-overview']);

  // Project Pages

  virtualType({
    ifHave:     IF_HAVE.PROJECT,
    labelKey:   'legacy.secrets',
    namespaced: true,
    name:       'project-secrets',
    weight:     104,
    route:      { name: 'c-cluster-legacy-project-page', params: { page: 'secrets' } },
    exact:      true,
    overview:   false,
  });

  virtualType({
    ifHave:     IF_HAVE.PROJECT,
    labelKey:   'legacy.configMaps',
    namespaced: true,
    name:       'project-config-maps',
    weight:     104,
    route:      { name: 'c-cluster-legacy-project-page', params: { page: 'config-maps' } },
    exact:      true,
    overview:   false,
  });

  basicType([
    'project-config-maps',
    'project-secrets',
  ], 'Project');
  setGroupDefaultType('project-config-maps', 'Project');
}
