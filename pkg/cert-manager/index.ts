import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { ProductChildCustomPage, ProductChildGroup } from '@shell/core/plugin-products-external';
import { ProductChildResourcePageInternal } from '@shell/core/plugin-products-internal';
import { CERT_MANAGER } from './types';
import * as navOverview from './config/nav';
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

// These CRDs are registered for server-side pagination (see `enableServerSidePagination` below),
// so the columns are supplied as `listConfig.headers` (the pagination header set). The shell's
// generic list renders them through `PaginatedResourceTable` once vai/SSP is available on the
// cluster, and falls back to client-side paging otherwise. Sort/search only reference indexed
// fields - see the note in table-headers.
const certificatesPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CERTIFICATE,
  sideMenu:   { weight: 90 },
  listConfig: { headers: CERTIFICATE_HEADERS },
};

const issuersPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.ISSUER,
  sideMenu:   { weight: 80 },
  listConfig: { headers: ISSUER_HEADERS },
};

const clusterIssuersPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CLUSTER_ISSUER,
  sideMenu:   { weight: 70 },
  listConfig: { headers: CLUSTER_ISSUER_HEADERS },
};

const certificateRequestsPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CERTIFICATE_REQUEST,
  sideMenu:   { weight: 30 },
  listConfig: { headers: CERTIFICATE_REQUEST_HEADERS },
};

const ordersPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.ORDER,
  sideMenu:   { weight: 20 },
  listConfig: { headers: ORDER_HEADERS },
};

const challengesPage: ProductChildResourcePageInternal = {
  type:       CERT_MANAGER.CHALLENGE,
  sideMenu:   { weight: 10 },
  listConfig: { headers: CHALLENGE_HEADERS },
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

  // Opt every cert-manager type into server-side pagination. The types carry custom list columns
  // (`listConfig.headers`), so they are not covered by the shell's `generic` auto-enablement and
  // must be named explicitly. This only declares support - it degrades to client-side paging on
  // clusters where vai/SSP is not available.
  extension.enableServerSidePagination({
    cluster: {
      resources: {
        enableSome: {
          enabled: [
            CERT_MANAGER.CERTIFICATE,
            CERT_MANAGER.ISSUER,
            CERT_MANAGER.CLUSTER_ISSUER,
            CERT_MANAGER.CERTIFICATE_REQUEST,
            CERT_MANAGER.ORDER,
            CERT_MANAGER.CHALLENGE,
          ],
        },
      },
    },
  });

  extension.extendProduct(EXPLORER, [certManagerGroup]);
  // Turns the overview into the group's landing page rather than a nav row of its own.
  // `ProductFunction` is typed as callable, but the extension manager invokes `.init(plugin, store)`
  // on whatever is registered - which is how the built-in products are wired up too.
  extension.addProduct(navOverview as any);
}
