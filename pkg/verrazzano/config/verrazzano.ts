import { createVerrazzanoRoute, rootVerrazzanoRoute } from '../utils/custom-routing';
import {
  STATE,
  NAME,
  AGE,
} from '@shell/config/table-headers';

export const WORKLOAD_KIND = {
  name:     'workloadKind',
  labelKey: 'verrazzano.common.headers.workloadKind',
  value:    'spec.workload.kind',
  sort:     ['workloadKind'],
  width:    100,
};

export const DEFINITION_NAME_KIND = {
  name:     'definitionName',
  labelKey: 'verrazzano.common.headers.definitionName',
  value:    'spec.definitionRef.name',
  sort:     ['definitionName']
};

export function init($plugin: any, store: any) {
  const {
    product,
    basicType,
    virtualType,
    headers,
    mapGroup
  } = $plugin.DSL(store, $plugin.name);

  product({
    ifHaveVerb:          'PUT',
    inStore:             'management',
    icon:                'vzlogo',
    removable:           false,
    showClusterSwitcher: false,
    to:                  rootVerrazzanoRoute(),
    category:            'verrazzano',
  });

  virtualType({
    labelKey:       'verrazzano.projects.label',
    name:           'projects',
    namespaced:     false,
    weight:         99,
    icon:           'folder',
    route:          createVerrazzanoRoute('c-cluster-projects',
      { resource: 'cluster.verrazzano.io.vberrazzanoproject' }
    )
  });

  virtualType({
    labelKey:       'verrazzano.apps.label',
    name:           'apps',
    namespaced:     false,
    weight:         97,
    icon:           'folder',
    route:          createVerrazzanoRoute('c-cluster-applications',
      { resource: 'core.oam.dev.applicationconfiguration' }
    )
  });

  virtualType({
    labelKey:       'verrazzano.multiClusterApps.label',
    name:           'mcapps',
    namespaced:     false,
    weight:         98,
    icon:           'folder',
    route:          {
      name:   'verrazzano-c-cluster-mcapps',
      params: { resource: 'clusters.verrazzano.io.multiclusterapplicationconfiguration' }
    }
  });

  virtualType({
    labelKey:       'verrazzano.components.label',
    name:           'components',
    namespaced:     false,
    weight:         96,
    icon:           'folder',
    route:          {
      name:   'verrazzano-c-cluster-components',
      params: { resource: 'core.oam.dev.component' }
    }
  });

  // assign these Kubernetes API groups to the name "Verrazzano".
  // they will appear under "More Resources / Verrazzano" in the cluster nav.

  const VERRAZZANO_GROUP = 'verrazzano';

  mapGroup('clusters.verrazzano.io', VERRAZZANO_GROUP);
  mapGroup('core.oam.dev', VERRAZZANO_GROUP);
  mapGroup('oam.verrazzano.io', VERRAZZANO_GROUP);
  mapGroup('install.verrazzano.io', VERRAZZANO_GROUP);
  mapGroup('coherence.oracle.com', VERRAZZANO_GROUP);
  mapGroup('weblogic.oracle', VERRAZZANO_GROUP);

  basicType([
    'apps',
    'mcapps',
    'components',
    'projects'
  ]);

  headers('core.oam.dev.component', [STATE, NAME, WORKLOAD_KIND, AGE]);

  headers('core.oam.dev.scopedefinition', [STATE, NAME, DEFINITION_NAME_KIND]);
  headers('core.oam.dev.traitdefinition', [STATE, NAME, DEFINITION_NAME_KIND]);
  headers('core.oam.dev.workloaddefinition', [STATE, NAME, DEFINITION_NAME_KIND]);

  // configureType(MANAGEMENT.SETTING, {
  //   isCreatable: false,
  //   isRemovable: false,
  //   showAge:     false,
  //   showState:   false,
  //   canYaml:     false,
  // });
  //
  // configureType(MANAGEMENT.FEATURE, {
  //   isCreatable: false,
  //   isRemovable: false,
  //   showAge:     false,
  //   showState:   true,
  //   canYaml:     false,
  // });
  //
  // headers(MANAGEMENT.FEATURE, [
  //   STATE,
  //   NAME_UNLINKED,
  //   FEATURE_DESCRIPTION,
  //   RESTART,
  // ]);
  //
  // hideBulkActions(MANAGEMENT.FEATURE, true);
}
