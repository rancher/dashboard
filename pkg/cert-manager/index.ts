import { importTypes } from '@rancher/auto-import';
import { IPlugin, PaginationHeaderOptions } from '@shell/core/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { ProductChildCustomPage, ProductChildGroup } from '@shell/core/plugin-products-external';
import { ProductChildResourcePageInternal } from '@shell/core/plugin-products-internal';
import { CERT_MANAGER } from './types';
import {
  CERTIFICATE_HEADERS, ISSUER_HEADERS, CLUSTER_ISSUER_HEADERS,
  CERTIFICATE_REQUEST_HEADERS, ORDER_HEADERS, CHALLENGE_HEADERS,
  TableHeader,
} from './table-headers';

const overviewPage: ProductChildCustomPage = {
  // `name` becomes the route path segment `/c/:cluster/explorer/<name>`, which is shared by
  // every extension that extends `explorer` - so it has to stay namespaced to cert-manager.
  name:      'cert-manager-overview',
  labelKey:  'certManager.nav.overview',
  component: () => import('./pages/Overview.vue'),
  sideMenu:  { weight: 100 },
  // Resource pages disappear on their own when the CRDs are absent (`allTypes` only walks
  // existing schemas). A virtual type does not, so this gate is what hides the whole group.
  enable:    { ifHaveType: CERT_MANAGER.CERTIFICATE },
};

// `listConfig.headers` maps to the *pagination* headers only. These CRDs are not registered for
// server-side pagination, so the client-side `localHeaders` are the ones that render.
//
// `localHeaders` is declared as `PaginationHeaderOptions[]` (which omits `getValue`), but it is
// forwarded to the DSL's client-side `headers` argument, where `getValue` is supported and used by
// the shell's own STATE/NAME columns. The cast works around that mistyping.
const localHeaders = (headers: TableHeader[]) => headers as PaginationHeaderOptions[];

const certificatesPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CERTIFICATE,
  sideMenu:   { weight: 90 },
  listConfig: { localHeaders: localHeaders(CERTIFICATE_HEADERS) },
};

const issuersPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.ISSUER,
  sideMenu:   { weight: 80 },
  listConfig: { localHeaders: localHeaders(ISSUER_HEADERS) },
};

const clusterIssuersPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CLUSTER_ISSUER,
  sideMenu:   { weight: 70 },
  listConfig: { localHeaders: localHeaders(CLUSTER_ISSUER_HEADERS) },
};

const certificateRequestsPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CERTIFICATE_REQUEST,
  sideMenu:   { weight: 30 },
  listConfig: { localHeaders: localHeaders(CERTIFICATE_REQUEST_HEADERS) },
};

const ordersPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.ORDER,
  sideMenu:   { weight: 20 },
  listConfig: { localHeaders: localHeaders(ORDER_HEADERS) },
};

const challengesPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CHALLENGE,
  sideMenu:   { weight: 10 },
  listConfig: { localHeaders: localHeaders(CHALLENGE_HEADERS) },
};

const acmeGroup: ProductChildGroup = {
  name:     'cert-manager-acme',
  labelKey: 'certManager.nav.group.acme',
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
    children: [overviewPage, certificatesPage, issuersPage, clusterIssuersPage, acmeGroup],
  },
};

export default function(extension: IPlugin) {
  importTypes(extension);
  extension.metadata = require('./package.json');

  extension.extendProduct(EXPLORER, [certManagerGroup]);
}
