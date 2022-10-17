import { RouteConfig } from 'vue-router';
import { PRODUCT_NAME } from '../config/harvester';

import Root from '../pages/c/_cluster/index.vue';
import HarvesterSupport from '../pages/c/_cluster/support/index.vue';
import HarvesterConsoleSerial from '../pages/c/_cluster/console/_uid/serial.vue';
import HarvesterConsoleVnc from '../pages/c/_cluster/console/_uid/vnc.vue';
import ListHarvesterResource from '../pages/c/_cluster/_resource/index.vue';
import CreateHarvesterResource from '../pages/c/_cluster/_resource/create.vue';
import ViewHarvesterResource from '../pages/c/_cluster/_resource/_id.vue';
import ViewHarvesterNsResource from '../pages/c/_cluster/_resource/_namespace/_id.vue';
import HarvesterAirgapUpdgrade from '../pages/c/_cluster/airgapupgrade/index.vue';
import HarvesterMembers from '../pages/c/_cluster/members/index.vue';
import ProjectNamespaces from '../pages/c/_cluster/projectsnamespaces.vue';

const routes: RouteConfig[] = [
  {
    name:      `${ PRODUCT_NAME }-c-cluster-support`,
    path:      `/:product/c/:cluster/support`,
    component: HarvesterSupport,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-console-uid-serial`,
    path:      `/:product/c/:cluster/console/:uid/serial`,
    component: HarvesterConsoleSerial,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-console-uid-vnc`,
    path:      `/:product/c/:cluster/console/:uid/vnc`,
    component: HarvesterConsoleVnc,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-airgapupgrade`,
    path:      `/:product/c/:cluster/airgapupgrade`,
    component: HarvesterAirgapUpdgrade,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-members`,
    path:      `/:product/c/:cluster/members`,
    component: HarvesterMembers,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster`,
    path:      `/:product/c/:cluster`,
    component: Root,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-projectsnamespaces`,
    path:      `/:product/c/:cluster/projectsnamespaces`,
    component: ProjectNamespaces,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource`,
    path:      `/:product/c/:cluster/:resource`,
    component: ListHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/:product/c/:cluster/:resource/create`,
    component: CreateHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-id`,
    path:      `/:product/c/:cluster/:resource/:id`,
    component: ViewHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-namespace-id`,
    path:      `/:product/c/:cluster/:resource/:namespace/:id`,
    component: ViewHarvesterNsResource,
  },

];

export default routes;
