<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { RcButton } from '@components/RcButton';
import { STATE, MGMT_CLUSTER_PROVIDER, MGMT_CLUSTER_KUBE_VERSION } from '@shell/config/table-headers';
import { STEVE_MGMT_STATE_COL, STEVE_NAME_COL, STEVE_MGMT_CLUSTER_PROVIDER, STEVE_MGMT_CLUSTER_KUBE_VERSION } from '@shell/config/pagination-table-headers';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { parseSi, formatSi, createMemoryFormat } from '@shell/utils/units';
import ManagementClusterUtils from '@shell/list/utils/management.cattle.io.cluster.utils';
import type MgmtCluster from '@shell/models/management.cattle.io.cluster';
import type { PaginationArgs } from '@shell/types/store/pagination.types';
import type { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts } from '@shell/types/components/paginatedResourceTable';
import type { WidgetSpec } from '../../templating/types';

// HOME CLUSTER TABLE — the stock Home's cluster section, exactly.
//
// This is NOT the configurable Table building block pointed at clusters. It is the real thing from
// shell/pages/home.vue: the "Clusters" heading, the Manage / Import Existing / Create buttons, and
// the same table — headers State / Name / Provider·Distro / Version·Architecture / CPU / Memory /
// Pods, the name linking into the cluster.
//
// Nothing about it is configurable but the heading. Its columns, its sorting and its buttons belong
// to the Home, and reproducing them through the generic Table's column pickers would be a worse
// copy of something we can simply use.
//
// It PAGES, through the stock Home's own paginated path, built from the shell's pieces rather than
// copies of them:
//
//   schema                  MANAGEMENT.CLUSTER, not the provisioning type. The paginated backend
//                           answers for mgmt clusters, and the rows carry what these columns read.
//                           The provisioning schema stays, but only to decide whether the Manage
//                           and Create buttons appear — which is a permission question.
//   paginationHeaders       the STEVE_* columns. A server-side sort needs the real field path
//                           (`spec.displayName`), which the client-side headers do not carry.
//   context 'home'          what turns server-side paging ON for this type. The store's defaults
//                           allow it for a short list of types in a named context, and this is that
//                           context. Without it the table asks for every row (pagesize=100000).
//   api-filter              pushes the search into the REQUEST. Filtering a page of ten would
//                           otherwise search ten rows and call the rest absent.
//   *SecondaryResources     CPU, memory and pods are not on the cluster row; they are fetched for
//                           the page that is actually on screen, and forgotten on the way out.

// The management cluster fields this table reads.
interface MgmtClusterRow {
  status?: { allocatable?: { cpu?: string; memory?: string } };
}

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);

// The context the pagination settings are keyed on. Sharing the stock Home's is deliberate: it is the
// same list of the same type on the same page, so it should page by the same rules.
const paginationContext = 'home';
const provClusterSchema = store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);
const mgmtClusterSchema = store.getters['management/schemaFor'](MANAGEMENT.CLUSTER);

const title = computed(() => props.widget.title || t('landing.clusters.title'));

// Same create/manage/import targets as the stock Home header buttons.
const manageLocation = {
  name:   'c-cluster-product-resource',
  params: {
    product: MANAGER, cluster: BLANK_CLUSTER, resource: CAPI.RANCHER_CLUSTER
  },
};
const createLocation = {
  name:   'c-cluster-product-resource-create',
  params: {
    product: MANAGER, cluster: BLANK_CLUSTER, resource: CAPI.RANCHER_CLUSTER
  },
};
const importLocation = { ...createLocation, query: { [MODE]: _IMPORT } };

const canCreateCluster = !!provClusterSchema?.collectionMethods?.find((x: string) => x.toLowerCase() === 'post');

const cpuHeader = {
  label: t('tableHeaders.cpu'), value: '', name: 'cpu', sort: ['status.allocatable.cpuRaw'], search: ['status.allocatable.cpuRaw']
};
const memoryHeader = {
  label: t('tableHeaders.memory'), value: '', name: 'memory', sort: ['status.allocatable.memoryRaw'], search: ['status.allocatable.memoryRaw']
};
const podsHeader = {
  label:        t('tableHeaders.pods'),
  name:         'pods',
  value:        '',
  sort:         ['status.allocatable.pods', 'status.requested.pods'],
  search:       ['status.allocatable.pods', 'status.requested.pods'],
  // Pods come with the page's secondary resources, so the column waits rather than showing a dash it
  // would have to take back.
  formatter:    'PodsUsage',
  delayLoading: true,
};

// What the table draws when it is paging CLIENT-side — the fallback the shell keeps for a backend
// that cannot page this type.
const headers = [
  STATE,
  {
    name: 'name', labelKey: 'tableHeaders.name', value: 'nameDisplay', sort: ['nameSort'], canBeVariable: true
  },
  {
    ...MGMT_CLUSTER_PROVIDER, labelKey: 'landing.clusters.provider', subLabel: t('landing.clusters.distro')
  },
  {
    ...MGMT_CLUSTER_KUBE_VERSION, labelKey: 'landing.clusters.kubernetesVersion', subLabel: t('landing.clusters.architecture')
  },
  cpuHeader,
  memoryHeader,
  podsHeader,
];

// The same columns for the SERVER-side path. They differ in one thing that matters: what they sort
// and search on is a field the API knows, so it can do both.
const paginationHeaders = [
  STEVE_MGMT_STATE_COL,
  {
    ...STEVE_NAME_COL, canBeVariable: true, value: 'spec.displayName', sort: ['spec.displayName'], search: 'spec.displayName'
  },
  {
    ...STEVE_MGMT_CLUSTER_PROVIDER, labelKey: 'landing.clusters.provider', subLabel: t('landing.clusters.distro')
  },
  {
    ...STEVE_MGMT_CLUSTER_KUBE_VERSION, labelKey: 'landing.clusters.kubernetesVersion', subLabel: t('landing.clusters.architecture')
  },
  cpuHeader,
  memoryHeader,
  podsHeader,
];

const filterRowsLocal = (rows: MgmtCluster[]) => ManagementClusterUtils.filterRowsLocal(rows, { $store: store });
const filterRowsApi = (pagination: PaginationArgs) => ManagementClusterUtils.filterRowsApi(pagination, { $store: store });
const fetchSecondaryResources = (opts: PagTableFetchSecondaryResourcesOpts) => Promise.all(ManagementClusterUtils.fetchSecondaryResources(opts, { $store: store }));

async function fetchPageSecondaryResources(opts: PagTableFetchPageSecondaryResourcesOpts): Promise<void> {
  await Promise.all(await ManagementClusterUtils.fetchPageSecondaryResources(opts, { $store: store }));
}

function cpuAllocatable(cluster: MgmtClusterRow): number {
  return parseSi(cluster?.status?.allocatable?.cpu || '');
}

function memoryAllocatable(cluster: MgmtClusterRow): string {
  const parsed = (parseSi(cluster?.status?.allocatable?.memory || '') || 0).toString();

  return formatSi(parsed, createMemoryFormat(parsed));
}

// The secondary resources are fetched per page and cached against this context. A widget that goes
// away without saying so leaves them behind for a page that no longer exists.
onBeforeUnmount(() => ManagementClusterUtils.forgetSecondaryResources({ context: paginationContext }, { $store: store }));
</script>

<template>
  <PaginatedResourceTable
    v-if="mgmtClusterSchema"
    :schema="mgmtClusterSchema"
    override-in-store="management"
    :headers="headers"
    :pagination-headers="paginationHeaders"
    :context="paginationContext"
    :local-filter="filterRowsLocal"
    :api-filter="filterRowsApi"
    :fetch-secondary-resources="fetchSecondaryResources"
    :fetch-page-secondary-resources="fetchPageSecondaryResources"
    :table-actions="false"
    :row-actions="false"
    :namespaced="false"
    :groupable="false"
    key-field="id"
  >
    <template #header-left>
      <div class="row table-heading">
        <h1 class="mb-0">
          {{ title }}
        </h1>
      </div>
    </template>

    <template
      v-if="canCreateCluster || !!provClusterSchema"
      #header-middle
    >
      <div class="table-heading">
        <RcButton
          v-if="!!provClusterSchema"
          variant="secondary"
          :to="manageLocation"
        >
          {{ t('cluster.manageAction') }}
        </RcButton>
        <RcButton
          v-if="canCreateCluster"
          :to="importLocation"
        >
          {{ t('cluster.importAction') }}
        </RcButton>
        <RcButton
          v-if="canCreateCluster"
          :to="createLocation"
        >
          {{ t('generic.create') }}
        </RcButton>
      </div>
    </template>

    <template #col:name="{ row }">
      <td class="col-name">
        <div class="list-cluster-name">
          <p
            v-if="row"
            class="cluster-name"
          >
            <router-link
              v-if="row.canExplore"
              :to="{ name: 'c-cluster-explorer', params: { cluster: row.id } }"
              role="link"
              :aria-label="row.nameDisplay"
            >
              {{ row.nameDisplay }}
            </router-link>
            <span v-else>{{ row.nameDisplay }}</span>
            <i
              v-if="row.unavailableMachines"
              v-clean-tooltip="row.unavailableMachines"
              class="conditions-alert-icon icon-alert icon"
            />
          </p>
          <p
            v-if="row.description"
            class="cluster-description"
          >
            {{ row.description }}
          </p>
        </div>
      </td>
    </template>

    <template #col:cpu="{ row }">
      <td v-if="cpuAllocatable(row)">
        {{ `${ cpuAllocatable(row) } ${ t('landing.clusters.cores', { count: cpuAllocatable(row) }) }` }}
      </td>
      <td v-else>
        &mdash;
      </td>
    </template>

    <template #col:memory="{ row }">
      <td v-if="memoryAllocatable(row) && !memoryAllocatable(row).match(/^0 [a-zA-z]/)">
        {{ memoryAllocatable(row) }}
      </td>
      <td v-else>
        &mdash;
      </td>
    </template>
  </PaginatedResourceTable>
</template>

<style lang="scss" scoped>
.table-heading {
  align-items: center;
  display:     flex;
  gap:         10px;
}
</style>
