import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { ProductChildCustomPage, ProductChildGroup, ProductChildResourcePage } from '@shell/core/plugin-products-external';
import { CERT_MANAGER } from './types';
import {
  CERTIFICATE_HEADERS, ISSUER_HEADERS, CLUSTER_ISSUER_HEADERS,
  CERTIFICATE_REQUEST_HEADERS, ORDER_HEADERS, CHALLENGE_HEADERS,
} from './table-headers';

const overviewPage: ProductChildCustomPage = {
  // `name` becomes the route path segment `/c/:cluster/explorer/<name>`, which is shared by
  // every extension that extends `explorer` - so it has to stay namespaced to cert-manager.
  name:      'cert-manager-overview',
  labelKey:  'certManager.nav.overview',
  component: () => import('./pages/overview/index.vue'),
  sideMenu:  { weight: 100 },
  // Resource pages disappear on their own when the CRDs are absent (`allTypes` only walks
  // existing schemas). A virtual type does not, so this gate is what hides the whole group.
  enable:    { ifHaveType: CERT_MANAGER.CERTIFICATE },
};

// cert-manager lists render client-side (local pagination); the extension does not opt into
// server-side pagination. Every type computes its own state (expiring, in-progress, ...) which the
// backend does not index, so SSP could neither sort nor filter on what these lists actually show.
// Columns are supplied as `listConfig.localHeaders`, which the shell's generic list renders through
// a client-side ResourceTable; sort/search may reference any field or model getter - see table-headers.
const certificatesPage: ProductChildResourcePage = {
  type:       CERT_MANAGER.CERTIFICATE,
  sideMenu:   { weight: 90 },
  listConfig: { localHeaders: CERTIFICATE_HEADERS },
};

const issuersPage: ProductChildResourcePage = {
  type:       CERT_MANAGER.ISSUER,
  sideMenu:   { weight: 80 },
  listConfig: { localHeaders: ISSUER_HEADERS },
};

const clusterIssuersPage: ProductChildResourcePage = {
  type:       CERT_MANAGER.CLUSTER_ISSUER,
  sideMenu:   { weight: 70 },
  listConfig: { localHeaders: CLUSTER_ISSUER_HEADERS },
};

const certificateRequestsPage: ProductChildResourcePage = {
  type:       CERT_MANAGER.CERTIFICATE_REQUEST,
  sideMenu:   { weight: 30 },
  listConfig: { localHeaders: CERTIFICATE_REQUEST_HEADERS },
};

const ordersPage: ProductChildResourcePage = {
  type:       CERT_MANAGER.ORDER,
  sideMenu:   { weight: 20 },
  listConfig: { localHeaders: ORDER_HEADERS },
};

const challengesPage: ProductChildResourcePage = {
  type:       CERT_MANAGER.CHALLENGE,
  sideMenu:   { weight: 10 },
  listConfig: { localHeaders: CHALLENGE_HEADERS },
};

const advancedGroup: ProductChildGroup = {
  name:     'cert-manager-advanced',
  labelKey: 'certManager.nav.group.advanced',
  sideMenu: {
    weight:   10,
    children: [certificateRequestsPage, ordersPage, challengesPage],
  },
};

const certManagerGroup: ProductChildGroup = {
  name:     'cert-manager',
  labelKey: 'certManager.nav.group.certManager',
  sideMenu: {
    // Explorer's own group weights are cluster 99, workload 98, serviceDiscovery 96,
    // storage 95, policy 94. 93 puts Cert Manager below them and above More Resources.
    weight:   93,
    children: [overviewPage, certificatesPage, issuersPage, clusterIssuersPage, advancedGroup],
  },
};

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  extension.extendProduct(EXPLORER, [certManagerGroup]);
}
