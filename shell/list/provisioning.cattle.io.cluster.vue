<script>
import { Banner } from '@components/Banner';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { allHash } from '@shell/utils/promise';
import { CAPI, MANAGEMENT, SNAPSHOT, NORMAN } from '@shell/config/types';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { filterOnlyKubernetesClusters, filterHiddenLocalCluster, paginationFilterHiddenLocalCluster } from '@shell/utils/cluster';
import { mapFeature, HARVESTER as HARVESTER_FEATURE } from '@shell/store/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { BadgeState } from '@components/BadgeState';
import CloudCredExpired from '@shell/components/formatter/CloudCredExpired';
import { PaginationParamFilter, FilterArgs, PaginationFilterField } from '@shell/types/store/pagination.types';
import { AGE, STATE } from '@shell/config/table-headers';
import { STEVE_NAME_COL, STEVE_STATE_COL, STEVE_AGE_COL } from '@shell/config/pagination-table-headers';
import { MACHINE_SUMMARY } from '@shell/config/product/manager';

export default {
  components: {
    Banner, PaginatedResourceTable, Masthead, BadgeState, CloudCredExpired
  },
  props: {
    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      paginationContext:          'provisioning.cattle.io.clusters',
      resource:                   CAPI.RANCHER_CLUSTER,
      schema:                     this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      canViewSnapshots:           this.$store.getters['management/canList'](SNAPSHOT),
      canViewCapiMachines:        this.$store.getters['management/canList'](CAPI.MACHINE),
      canViewManagementNodes:     this.$store.getters['management/canList'](MANAGEMENT.NODE),
      canViewManagementPools:     this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL),
      canViewManagementTemplates: this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE),
      canViewMachineDeployments:  this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT),
      canViewRkeTemplateRevision: this.$store.getters['management/canList'](MANAGEMENT.RKE_TEMPLATE_REVISION),
    };
  },

  computed: {
    // We no longer make the request for rows the paginated table does. We still need to access these rows for things like harvester.
    rows() {
      return this.$refs.paginatedTable?.rows || [];
    },

    // We no longer make the request for rows the paginated table does. We still need to access these rows for things like harvester.
    filteredRows() {
      return this.$refs.paginatedTable?.filteredRows || [];
    },

    isPaginationEnabled() {
      return this.$store.getters['management/paginationEnabled']({ id: CAPI.RANCHER_CLUSTER, context: this.paginationContext });
    },

    hiddenHarvesterCount() {
      const product = this.$store.getters['currentProduct'];
      const isExplorer = product?.name === EXPLORER;

      // Don't show Harvester banner message on the cluster management page or if Harvester if not enabled
      if (!isExplorer || !this.harvesterEnabled) {
        return 0;
      }

      return this.rows.length - filterOnlyKubernetesClusters(this.rows, this.$store).length;
    },

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource
        },
      };
    },

    importLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource
        },
        query: { [MODE]: _IMPORT }
      };
    },

    canImport() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    },

    harvesterEnabled: mapFeature(HARVESTER_FEATURE),

    nonStandardNamespaces() {
      if (this.isPaginationEnabled) {
        return false;
      }

      // Show the namespace grouping option if there's clusters with namespaces other than 'fleet-default' or 'fleet-local'
      // This will be used when there's clusters from extension based provisioners
      // We should re-visit this for scaling reasons
      return this.filteredRows.some((c) => c.metadata.namespace !== 'fleet-local' && c.metadata.namespace !== 'fleet-default');
    },

    tokenExpiredData() {
      const counts = this.rows.reduce((res, provCluster) => {
        const expireData = provCluster.cloudCredential?.expireData;

        if (expireData?.expiring) {
          res.expiring++;
        }
        if (expireData?.expired) {
          res.expired++;
        }

        return res;
      }, {
        expiring: 0,
        expired:  0
      });

      return {
        expiring: counts.expiring ? this.t('cluster.cloudCredentials.banners.expiring', { count: counts.expiring }) : '',
        expired:  counts.expired ? this.t('cluster.cloudCredentials.banners.expired', { count: counts.expired }) : '',
      };
    },

    headers() {
      return [
        STATE,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          formatter:     'ClusterLink',
          canBeVariable: true,
        },
        {
          name:     'kubernetesVersion',
          labelKey: 'tableHeaders.version',
          subLabel: 'Architecture',
          value:    'kubernetesVersion',
          sort:     'kubernetesVersion',
          search:   'kubernetesVersion',
        },
        {
          name:      'provider',
          labelKey:  'tableHeaders.provider',
          subLabel:  'Distro',
          value:     'machineProvider',
          sort:      ['machineProvider', 'provisioner'],
          formatter: 'ClusterProvider',
        },
        MACHINE_SUMMARY,
        AGE,
        {
          name:  'explorer',
          label: ' ',
          align: 'right',
          width: 65,
        }];
    },
    paginationHeaders() {
      return [
        STEVE_STATE_COL,
        {
          ...STEVE_NAME_COL,
          getValue:      (row) => row.metadata?.name,
          canBeVariable: true,
        },
        {
          name:     'kubernetesVersion',
          labelKey: 'tableHeaders.version',
          subLabel: 'Architecture',
          sort:     false,
          search:   false,
        },
        {
          label:     this.t('landing.clusters.provider'),
          subLabel:  this.t('landing.clusters.distro'),
          value:     'mgmt.status.provider',
          name:      'Provider',
          sort:      false,
          search:    false,
          formatter: 'ClusterProvider'
        },
        MACHINE_SUMMARY,
        STEVE_AGE_COL,
        {
          name:  'explorer',
          label: ' ',
          align: 'right',
          width: 65,
        }
      ];
    }
  },

  methods: {
    clusterFilter(clusters) {
      // If Harvester feature is enabled, hide Harvester Clusters
      if (this.harvesterEnabled) {
        return filterHiddenLocalCluster(filterOnlyKubernetesClusters(clusters, this.$store), this.$store);
      }

      // Otherwise, show Harvester clusters - these will be shown with a warning
      const filter = filterHiddenLocalCluster(clusters, this.$store);

      return filter;
    },
    apiFilter(pagination) {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      // The first filter is has an empty fields prop which is causing the table to be empty
      pagination.filters = pagination.filters.filter((f) => f.fields.length > 0);
      const localClusterFilter = paginationFilterHiddenLocalCluster(this.$store, false);

      if (localClusterFilter) {
        pagination.filters.push(localClusterFilter);
      }

      return pagination;
    },
    async fetchSecondaryResources() {
      const hash = {
        rancherClusters: this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
        normanClusters:  this.$store.dispatch('rancher/findAll', { type: NORMAN.CLUSTER }),
        mgmtClusters:    this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      };

      this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

      if ( this.canViewSnapshots ) {
        hash.etcdSnapshots = this.$store.dispatch('management/findAll', { type: SNAPSHOT });
      }

      if ( this.canViewCapiMachines ) {
        hash.capiMachines = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
      }

      if ( this.canViewManagementNodes ) {
        hash.mgmtNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
      }

      if ( this.canViewManagementPools ) {
        hash.mgmtPools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      }

      if ( this.canViewManagementTemplates ) {
        hash.mgmtTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
      }

      if ( this.canViewMachineDeployments ) {
        hash.machineDeployments = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT });
      }

      // Fetch RKE template revisions so we can show when an updated template is available
      // This request does not need to be blocking
      if ( this.canViewRkeTemplateRevision ) {
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.RKE_TEMPLATE_REVISION });
      }

      await allHash(hash);
    },

    async fetchPageSecondaryResources({
      canPaginate, force, page, pagResult
    }) {
      if (!canPaginate || !page?.length) {
        return;
      }

      const hash = {};

      if ( this.canViewSnapshots ) {
        const paginatedOpt = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r) => new PaginationFilterField({
              field: 'spec.clusterName',
              value: r.metadata.name
            }))),
          })
        };

        hash.etcdSnapshots = this.$store.dispatch(`management/findPageOrAll`, {
          type: SNAPSHOT, context: this.paginationContext, paginatedOpt
        });
      }

      if ( this.canViewCapiMachines ) {
        const paginatedOpt = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r) => new PaginationFilterField({
              field: 'spec.clusterName',
              value: r.metadata.name
            }))),
          })
        };

        hash.capiMachines = this.$store.dispatch(`management/findPageOrAll`, {
          type: CAPI.MACHINE, context: this.paginationContext, paginatedOpt
        });
      }

      if ( this.canViewManagementNodes ) {
        const paginatedOpt = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r) => new PaginationFilterField({
              field: 'id',
              value: r.id,
              exact: false,
            }))),
          })
        };

        hash.mgmtNodes = this.$store.dispatch(`management/findPageOrAll`, {
          type: MANAGEMENT.NODE, context: this.paginationContext, paginatedOpt
        });
      }

      if ( this.canViewManagementTemplates && this.canViewManagementPools ) {
        const nodePoolFilters = PaginationParamFilter.createMultipleFields(page
          .filter((p) => p.status?.clusterName)
          .map((r) => new PaginationFilterField({
            field: 'spec.clusterName',
            value: r.status?.clusterName
          })));
        const nodePools = await this.$store.dispatch(`management/findPageOrAll`, {
          type:         MANAGEMENT.NODE_POOL,
          context:      this.paginationContext,
          paginatedOpt: {
            force,
            pagination: new FilterArgs({ filters: nodePoolFilters })
          }
        });

        const templateOpt = PaginationParamFilter.createMultipleFields(nodePools
          .filter((np) => !!np.nodeTemplateId)
          .map((np) => new PaginationFilterField({
            field: 'id',
            value: np.nodeTemplateId,
            exact: true,
          })));

        hash.mgmtTemplates = this.$store.dispatch(`management/findPageOrAll`, {
          type:         MANAGEMENT.NODE_TEMPLATE,
          context:      this.paginationContext,
          paginatedOpt: {
            force,
            pagination: new FilterArgs({ filters: templateOpt })
          }
        });
      }

      if ( this.canViewMachineDeployments ) {
        const paginatedOpt = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r) => new PaginationFilterField({
              field: 'spec.clusterName',
              value: r.metadata.name
            }))),
          })
        };

        hash.machineDeployments = this.$store.dispatch(`management/findPageOrAll`, {
          type: CAPI.MACHINE_DEPLOYMENT, context: this.paginationContext, paginatedOpt
        });
      }

      await allHash(hash);
    },
  },

  beforeUnmount() {
    this.$store.dispatch('management/forgetType', SNAPSHOT);
    this.$store.dispatch('management/forgetType', CAPI.MACHINE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE_TEMPLATE);
    this.$store.dispatch('management/forgetType', CAPI.MACHINE_DEPLOYMENT);
  },

  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="hiddenHarvesterCount"
      color="info"
      :label="t('cluster.harvester.clusterWarning', {count: hiddenHarvesterCount} )"
    />
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
      component-testid="cluster-manager-list"
      :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-indeterminate="loadIndeterminate"
    >
      <template
        v-if="canImport"
        #extraActions
      >
        <router-link
          :to="importLocation"
          class="btn role-primary mr-10"
          data-testid="cluster-manager-list-import"
        >
          {{ t('cluster.importAction') }}
        </router-link>
      </template>
    </Masthead>

    <Banner
      v-if="tokenExpiredData.expiring"
      color="warning"
      :label="tokenExpiredData.expiring"
    />
    <Banner
      v-if="tokenExpiredData.expired"
      color="error"
      :label="tokenExpiredData.expired"
    />

    <PaginatedResourceTable
      ref="paginatedTable"
      :schema="schema"
      :headers="headers"
      :pagination-headers="paginationHeaders"
      :namespaced="nonStandardNamespaces"
      :api-filter="apiFilter"
      :local-filter="clusterFilter"
      :fetch-secondary-resources="fetchSecondaryResources"
      :fetch-page-secondary-resources="fetchPageSecondaryResources"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :data-testid="'cluster-list'"
      :sub-rows="true"
      :context="paginationContext"
    >
      <!-- Why are state column and subrow overwritten here? -->
      <!-- for rke1 clusters, where they try to use the mgmt cluster stateObj instead of prov cluster stateObj,  -->
      <!-- updates were getting lost. This isn't performant as normal columns, but the list shouldn't grow -->
      <!-- big enough for the performance to matter -->
      <template #cell:state="{row}">
        <BadgeState
          :color="row.stateBackground"
          :label="row.stateDisplay"
        />
      </template>
      <template #sub-row="{fullColspan, row, keyField, componentTestid, i, onRowMouseEnter, onRowMouseLeave}">
        <tr
          :key="row[keyField] + '-description'"
          :data-testid="componentTestid + '-' + i + '-row-description'"
          class="state-description sub-row"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <td v-if="row.cloudCredentialWarning || row.stateDescription">
&nbsp;
          </td>
          <td
            v-if="row.cloudCredentialWarning || row.stateDescription"
            :colspan="fullColspan - 1"
          >
            <CloudCredExpired
              v-if="row.cloudCredentialWarning"
              :value="row.cloudCredential.expires"
              :row="row.cloudCredential"
              :verbose="true"
              :class="{'mb-10': row.stateDescription}"
            />
            <div
              v-if="row.stateDescription"
              :class="{ 'text-error' : row.stateObj.error }"
            >
              {{ row.stateDescription }}
            </div>
          </td>
        </tr>
      </template>
      <template #cell:summary="{row}">
        <span v-if="!row.stateParts.length">{{ row.nodes.length }}</span>
      </template>
      <template #col:kubernetesVersion="{row}">
        <td class="col-name">
          <span>
            {{ row.kubernetesVersion }}
          </span>
          <div
            v-clean-tooltip="{content: row.architecture.tooltip, placement: 'left'}"
            class="text-muted"
          >
            {{ row.architecture.label }}
          </div>
        </td>
      </template>
      <template #cell:explorer="{row}">
        <router-link
          v-if="row.mgmt && row.mgmt.isReady && !row.hasError"
          data-testid="cluster-manager-list-explore-management"
          class="btn btn-sm role-secondary"
          :to="{name: 'c-cluster', params: {cluster: row.mgmt.id}}"
        >
          {{ t('cluster.explore') }}
        </router-link>
        <button
          v-else
          data-testid="cluster-manager-list-explore"
          :disabled="true"
          class="btn btn-sm role-secondary"
        >
          {{ t('cluster.explore') }}
        </button>
      </template>
    </PaginatedResourceTable>
  </div>
</template>
