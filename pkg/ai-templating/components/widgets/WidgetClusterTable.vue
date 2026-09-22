<script>
import ResourceTable from '@shell/components/ResourceTable.vue';
import { RcButton } from '@components/RcButton';
import { STATE, MGMT_CLUSTER_PROVIDER, MGMT_CLUSTER_KUBE_VERSION } from '@shell/config/table-headers';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { parseSi, formatSi, createMemoryFormat } from '@shell/utils/units';

// HOME CLUSTER TABLE — the stock Home's cluster section, exactly.
//
// This is NOT the configurable Table building block pointed at clusters. It is the real thing from
// shell/pages/home.vue: the "Clusters" heading, the Manage / Import Existing / Create buttons, and
// the same table — provisioning clusters as rows, headers State / Name / Provider·Distro /
// Version·Architecture / CPU / Memory / Pods, the name linking into the cluster, CPU and Memory read
// from the backing management cluster.
//
// Nothing about it is configurable but the heading. Its columns, its sorting and its buttons belong
// to the Home, and reproducing them through the generic Table's column pickers would be a worse
// copy of something we can simply use.
//
// Widget spec: { kind: 'clusterTable', title?: 'Clusters' }
export default {
  name:       'WidgetClusterTable',
  components: { ResourceTable, RcButton },

  props: {
    widget: {
      type:    Object,
      default: () => ({}),
    },
  },

  async fetch() {
    this.loading = true;

    try {
      // Provisioning clusters are the rows; management clusters back `row.mgmt` (CPU/Memory, link).
      const [prov] = await Promise.all([
        this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      ]);

      this.rows = prov || [];
    } catch (e) {
      this.rows = [];
    } finally {
      this.loading = false;
    }
  },

  data() {
    return { rows: [], loading: true };
  },

  computed: {
    schema() {
      return this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);
    },

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
      return !!this.schema?.collectionMethods?.find((x) => x.toLowerCase() === 'post');
    },

    // The stock Home's cluster columns, fixed. Column choice and sorting are deliberately NOT
    // configurable here — that belongs to the table layer, not to this widget.
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
        {
          label: this.t('tableHeaders.cpu'), value: '', name: 'cpu', sort: ['status.allocatable.cpuRaw']
        },
        {
          label: this.t('tableHeaders.memory'), value: '', name: 'memory', sort: ['status.allocatable.memoryRaw']
        },
        {
          label: this.t('tableHeaders.pods'), name: 'pods', value: '', sort: ['status.allocatable.pods'], formatter: 'PodsUsage', delayLoading: true
        },
      ];
    },
  },

  methods: {
    t(key, args) {
      return this.$store.getters['i18n/t'](key, args);
    },

    cpuAllocatable(cluster) {
      return parseSi(cluster.status?.allocatable?.cpu);
    },

    memoryAllocatable(cluster) {
      const parsed = (parseSi(cluster.status?.allocatable?.memory) || 0).toString();

      return formatSi(parsed, createMemoryFormat(parsed));
    },
  },
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :headers="headers"
    :loading="loading"
    :table-actions="false"
    :row-actions="false"
    :namespaced="false"
    :groupable="false"
    :rows-per-page="10"
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
      v-if="canCreateCluster || !!schema"
      #header-middle
    >
      <div class="table-heading">
        <RcButton
          v-if="!!schema"
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
            v-if="row.mgmt"
            class="cluster-name"
          >
            <router-link
              v-if="row.mgmt.isReady && !row.hasError"
              :to="{ name: 'c-cluster-explorer', params: { cluster: row.mgmt.id } }"
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
            <i
              v-if="row.isRke1"
              v-clean-tooltip="t('cluster.rke1Unsupported')"
              class="rke1-unsupported-icon icon-warning icon"
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
    <template #col:kubernetesVersion="{ row }">
      <td class="col-name">
        <span>{{ row.kubernetesVersion }}</span>
        <div
          v-if="row.architecture"
          v-clean-tooltip="{ content: row.architecture.tooltip, placement: 'left' }"
          class="text-muted"
        >
          {{ row.architecture.label }}
        </div>
      </td>
    </template>
    <template #col:cpu="{ row }">
      <td v-if="row.mgmt && cpuAllocatable(row.mgmt)">
        {{ `${ cpuAllocatable(row.mgmt) } ${ t('landing.clusters.cores', { count: cpuAllocatable(row.mgmt) }) }` }}
      </td>
      <td v-else>
        &mdash;
      </td>
    </template>
    <template #col:memory="{ row }">
      <td v-if="row.mgmt && memoryAllocatable(row.mgmt) && !memoryAllocatable(row.mgmt).match(/^0 [a-zA-z]/)">
        {{ memoryAllocatable(row.mgmt) }}
      </td>
      <td v-else>
        &mdash;
      </td>
    </template>
  </ResourceTable>
</template>

<style lang="scss" scoped>
.table-heading {
  align-items: center;
  display:     flex;
  gap:         10px;
}
</style>
