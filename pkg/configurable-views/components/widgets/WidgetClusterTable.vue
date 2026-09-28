<script>
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
// It PAGES. It used to `findAll` both cluster types, which is two requests for every cluster in the
// installation to draw ten rows. It now takes the stock Home's paginated path instead, and the
// pieces it needs for that are the shell's own, not copies:
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
//
// Widget spec: { kind: 'clusterTable', title?: 'Clusters' }
export default {
  name:       'WidgetClusterTable',
  components: { PaginatedResourceTable, RcButton },

  props: {
    widget: {
      type:    Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      // The context the pagination settings are keyed on. Sharing the stock Home's is deliberate:
      // it is the same list of the same type on the same page, so it should page by the same rules.
      paginationContext: 'home',
      provClusterSchema: this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      mgmtClusterSchema: this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER),
    };
  },

  computed: {
    title() {
      return this.widget.title || this.t('landing.clusters.title');
    },

    // Same create/manage/import targets as the stock Home header buttons.
    manageLocation() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product: MANAGER, cluster: BLANK_CLUSTER, resource: CAPI.RANCHER_CLUSTER
        },
      };
    },

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product: MANAGER, cluster: BLANK_CLUSTER, resource: CAPI.RANCHER_CLUSTER
        },
      };
    },

    importLocation() {
      return { ...this.createLocation, query: { [MODE]: _IMPORT } };
    },

    canCreateCluster() {
      return !!this.provClusterSchema?.collectionMethods?.find((x) => x.toLowerCase() === 'post');
    },

    // What the table draws when it is paging CLIENT-side — the fallback the shell keeps for a
    // backend that cannot page this type.
    headers() {
      return [
        STATE,
        {
          name: 'name', labelKey: 'tableHeaders.name', value: 'nameDisplay', sort: ['nameSort'], canBeVariable: true
        },
        {
          ...MGMT_CLUSTER_PROVIDER, labelKey: 'landing.clusters.provider', subLabel: this.t('landing.clusters.distro')
        },
        {
          ...MGMT_CLUSTER_KUBE_VERSION, labelKey: 'landing.clusters.kubernetesVersion', subLabel: this.t('landing.clusters.architecture')
        },
        this.cpuHeader,
        this.memoryHeader,
        this.podsHeader,
      ];
    },

    // The same columns for the SERVER-side path. They differ in one thing that matters: what they
    // sort and search on is a field the API knows, so it can do both.
    paginationHeaders() {
      return [
        STEVE_MGMT_STATE_COL,
        {
          ...STEVE_NAME_COL, canBeVariable: true, value: 'spec.displayName', sort: ['spec.displayName'], search: 'spec.displayName'
        },
        {
          ...STEVE_MGMT_CLUSTER_PROVIDER, labelKey: 'landing.clusters.provider', subLabel: this.t('landing.clusters.distro')
        },
        {
          ...STEVE_MGMT_CLUSTER_KUBE_VERSION, labelKey: 'landing.clusters.kubernetesVersion', subLabel: this.t('landing.clusters.architecture')
        },
        this.cpuHeader,
        this.memoryHeader,
        this.podsHeader,
      ];
    },

    cpuHeader() {
      return {
        label: this.t('tableHeaders.cpu'), value: '', name: 'cpu', sort: ['status.allocatable.cpuRaw'], search: ['status.allocatable.cpuRaw']
      };
    },

    memoryHeader() {
      return {
        label: this.t('tableHeaders.memory'), value: '', name: 'memory', sort: ['status.allocatable.memoryRaw'], search: ['status.allocatable.memoryRaw']
      };
    },

    podsHeader() {
      return {
        label:        this.t('tableHeaders.pods'),
        name:         'pods',
        value:        '',
        sort:         ['status.allocatable.pods', 'status.requested.pods'],
        search:       ['status.allocatable.pods', 'status.requested.pods'],
        // Pods come with the page's secondary resources, so the column waits rather than showing a
        // dash it would have to take back.
        formatter:    'PodsUsage',
        delayLoading: true,
      };
    },
  },

  // The secondary resources are fetched per page and cached against this context. A widget that
  // goes away without saying so leaves them behind for a page that no longer exists.
  beforeUnmount() {
    ManagementClusterUtils.forgetSecondaryResources({ context: this.paginationContext }, { $store: this.$store });
  },

  methods: {
    t(key, args) {
      return this.$store.getters['i18n/t'](key, args);
    },

    filterRowsLocal(rows) {
      return ManagementClusterUtils.filterRowsLocal(rows, { $store: this.$store });
    },

    filterRowsApi(pagination) {
      return ManagementClusterUtils.filterRowsApi(pagination, { $store: this.$store });
    },

    fetchSecondaryResources(opts) {
      return Promise.all(ManagementClusterUtils.fetchSecondaryResources(opts, { $store: this.$store }));
    },

    async fetchPageSecondaryResources({
      canPaginate, force, page, pagResult
    }) {
      const promises = await ManagementClusterUtils.fetchPageSecondaryResources({
        canPaginate, force, page, pagResult
      }, { $store: this.$store });

      await Promise.all(promises);
    },

    cpuAllocatable(cluster) {
      return parseSi(cluster?.status?.allocatable?.cpu);
    },

    memoryAllocatable(cluster) {
      const parsed = (parseSi(cluster?.status?.allocatable?.memory) || 0).toString();

      return formatSi(parsed, createMemoryFormat(parsed));
    },
  },
};
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
