import { RouteConfig } from 'vue-router';

import { VERRAZZANO_PRODUCT_NAME } from '../types';

import VerrazzanoLanding from '../pages/index.vue';
import ApplicationsResourceList from '../pages/c/_cluster/applications/index.vue';
import ApplicationCreate from '../pages/c/_cluster/applications/create.vue';
import ComponentsResourceList from '../pages/c/_cluster/components/index.vue';
import ComponentCreate from '../pages/c/_cluster/components/create.vue';
import MultiClusterAppsResourceList from '../pages/c/_cluster/mcapps/index.vue';
import MultiClusterAppCreate from '../pages/c/_cluster/mcapps/create.vue';
import ProjectsResourceList from '../pages/c/_cluster/projects/index.vue';
import ProjectsCreate from '../pages/c/_cluster/projects/create.vue';

const routes: RouteConfig[] = [{
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-applications`,
  path:      `/:product/c/:cluster/applications`,
  component: ApplicationsResourceList,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-mcapps`,
  path:      `/:product/c/:cluster/mcapps`,
  component: MultiClusterAppsResourceList,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-components`,
  path:      `/:product/c/:cluster/components`,
  component: ComponentsResourceList,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-projects`,
  path:      `/:product/c/:cluster/projects`,
  component: ProjectsResourceList,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-applications-create`,
  path:      `/:product/c/:cluster/applications/create`,
  component: ApplicationCreate,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-mcapps-create`,
  path:      `/:product/c/:cluster/mcapps/create`,
  component: MultiClusterAppCreate,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-components-create`,
  path:      `/:product/c/:cluster/components/create`,
  component: ComponentCreate,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }-c-cluster-projects-create`,
  path:      `/:product/c/:cluster/projects/create`,
  component: ProjectsCreate,
}, {
  name:      `${ VERRAZZANO_PRODUCT_NAME }`,
  path:      `/:product`,
  component: VerrazzanoLanding,
}];

export default routes;
