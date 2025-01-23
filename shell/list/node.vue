<script lang="ts">
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import Tag from '@shell/components/Tag.vue';
import { Banner } from '@components/Banner';
import { PODS } from '@shell/config/table-headers';
import metricPoller from '@shell/mixins/metric-poller';

import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations.js';

import { defineComponent } from 'vue';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';

import {
  CAPI,
  MANAGEMENT, METRIC, NODE, NORMAN, POD
} from '@shell/config/types';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { COLUMN_BREAKPOINTS } from '@shell/types/store/type-map';

import { mapGetters } from 'vuex';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';

export default defineComponent({
  name: 'ListNode',

  components: {
    PaginatedResourceTable,
    Tag,
    Banner
  },

  mixins: [metricPoller],

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },

    listComponent: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      // Pods required for `Pods` column's running pods metrics
      // podConsumedUsage = podConsumed / podConsumedUsage. podConsumed --> pods. allPods.filter((pod) => pod.spec.nodeName === this.name)
      canViewPods:        !!this.$store.getters[`cluster/schemaFor`](POD),
      // Norman node required for Drain/Cordon/Uncordon action
      canViewNormanNodes: !!this.$store.getters[`rancher/schemaFor`](NORMAN.NODE),
      // Mgmt Node required to find Norman node
      canViewMgmtNodes:   !!this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE),
      // Required for ssh / download key actions
      canViewMachines:    !!this.$store.getters[`management/schemaFor`](CAPI.MACHINE),
      // Required for CPU and RAM columns
      canViewNodeMetrics: !!this.$store.getters['cluster/schemaFor'](METRIC.NODE),
    };
  },

  beforeUnmount() {
    // Stop watching pods, nodes and node metrics
    if (this.canViewPods) {
      this.$store.dispatch('cluster/forgetType', POD);
    }

    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
  },

  computed: {
    ...mapGetters(['currentCluster']),

    kubeNodes() {
      // Note if server side pagination is used this is only the current page
      return this.$store.getters[`cluster/all`](this.resource);
    },

    hasWindowsNodes() {
      // Note if server side pagination is used this is only applicable to the current page
      return (this.kubeNodes || []).some((node: any) => node.status.nodeInfo.operatingSystem === 'windows');
    },

    tableGroup: mapPref(GROUP_RESOURCES),

    canPaginate() {
      const args = { id: this.resource?.id || this.resource };

      return this.resource && this.$store.getters[`cluster/paginationEnabled`]?.(args);
    },

    headers() {
      // This is all about adding the pods column... if the user can see pods
      const headers = [...this.$store.getters['type-map/headersFor'](this.schema, false)];

      if (this.canViewPods) {
        headers.splice(headers.length - 1, 0, {
          ...PODS,
          breakpoint: COLUMN_BREAKPOINTS.DESKTOP,
          getValue:   (row: any) => row.podConsumedUsage
        });
      }

      return headers;
    },

    paginationHeaders() {
      // This is all about adding the pods column... if the user can see pods

      if (!this.canPaginate) {
        return [];
      }

      const paginationHeaders = [...this.$store.getters['type-map/headersFor'](this.schema, true)];

      if (paginationHeaders) {
        if (this.canViewPods) {
          paginationHeaders.splice(paginationHeaders.length - 1, 0, {
            ...PODS,
            breakpoint: COLUMN_BREAKPOINTS.DESKTOP,
            sort:       false,
            search:     false,
            getValue:   (row: any) => row.podConsumedUsage
          });
        }

        return paginationHeaders;
      } else {
        console.warn('Nodes list expects pagination headers but none found'); // eslint-disable-line no-console

        return [];
      }
    },
  },

  methods: {
    async loadMetrics() {
      if (!this.canViewNodeMetrics) {
        return;
      }

      if (this.canPaginate) {
        if (!this.kubeNodes.length) {
          return;
        }

        const opt: ActionFindPageArgs = {
          force:      true,
          pagination: new FilterArgs({
            filters: new PaginationParamFilter({
              fields: this.kubeNodes.map((r: any) => new PaginationFilterField({
                field: 'metadata.name',
                value: r.id
              }))
            })
          })
        };

        await this.$store.dispatch('cluster/findPage', {
          type: METRIC.NODE,
          opt
        });
      } else {
        await this.$store.dispatch('cluster/findAll', {
          type: METRIC.NODE,
          opt:  { force: true }
        });
      }

      this.$forceUpdate();
    },

    toggleLabels(row: any) {
      row['displayLabels'] = !row.displayLabels;
    },

    /**
     * of type PagTableFetchSecondaryResources
     */
    async fetchSecondaryResources({ canPaginate }: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      if (canPaginate) {
        return;
      }
      const promises = [];

      if (this.canViewMgmtNodes) {
        promises.push(this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.NODE }));
      }

      if (this.canViewNormanNodes) {
        promises.push(this.$store.dispatch(`rancher/findAll`, { type: NORMAN.NODE }));
      }

      if (this.canViewMachines) {
        promises.push(this.$store.dispatch(`management/findAll`, { type: CAPI.MACHINE }));
      }

      if (this.canViewPods) {
        // No need to block on this
        this.$store.dispatch(`cluster/findAll`, { type: POD });
      }

      await Promise.all(promises);
    },

    /**
     * Nodes columns need other resources in order to show data in some columns
     *
     * In the paginated world we want to restrict the fetch of those resources to only the one's we need
     *
     * So when we have a page.... use those entries as filters when fetching the other resources
     */
    async fetchPageSecondaryResources({ canPaginate, force, page }: PagTableFetchPageSecondaryResourcesOpts) {
      if (!page?.length) {
        return;
      }

      if (this.canViewMgmtNodes && this.canViewNormanNodes) {
        if (this.canViewNormanNodes) {
          // Ideally we only fetch the nodes we need....
          this.$store.dispatch(`rancher/findAll`, { type: NORMAN.NODE });
        }

        // We only fetch mgmt node to get norman node. We only fetch node to get node actions
        // See https://github.com/rancher/dashboard/issues/10743
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
              field: 'status.nodeName',
              value: r.id
            }))),
          })
        };

        this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.NODE, opt });
      }

      if (this.canViewMachines) {
        const namespace = this.currentCluster.provClusterId?.split('/')[0];

        if (namespace) {
          const opt: ActionFindPageArgs = {
            force,
            namespaced: namespace,
            pagination: new FilterArgs({
              filters: PaginationParamFilter.createMultipleFields(
                page.reduce((res: PaginationFilterField[], r: any ) => {
                  const name = r.metadata?.annotations?.[CAPI_ANNOTATIONS.MACHINE_NAME];

                  if (name) {
                    res.push(new PaginationFilterField({
                      field: 'metadata.name',
                      value: name,
                    }));
                  }

                  return res;
                }, [])
              )
            })
          };

          this.$store.dispatch(`management/findPage`, { type: CAPI.MACHINE, opt });
        }
      }

      if (this.canViewPods) {
        // Note - fetching pods for current page could be a LOT still (probably max of 3k - 300 pods per node x 100 nodes in a page)
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(
              page.map((r: any) => new PaginationFilterField({
                field: 'spec.nodeName',
                value: r.id,
              }))
            )
          })
        };

        this.$store.dispatch(`cluster/findPage`, { type: POD, opt });
      }

      // Fetch metrics given the current page
      this.loadMetrics();
    },
  },
});
</script>

<template>
  <div>
    <Banner
      v-if="hasWindowsNodes"
      color="info"
      :label="t('cluster.custom.registrationCommand.windowsWarning')"
    />
    <PaginatedResourceTable
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :paginationHeaders="paginationHeaders"
      :sub-rows="true"
      :fetchSecondaryResources="fetchSecondaryResources"
      :fetchPageSecondaryResources="fetchPageSecondaryResources"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      data-testid="cluster-node-list"
    >
      <template #sub-row="{fullColspan, row, onRowMouseEnter, onRowMouseLeave}">
        <tr
          class="taints sub-row"
          :class="{'empty-taints': ! row.displayTaintsAndLabels}"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <template v-if="row.displayTaintsAndLabels">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td :colspan="fullColspan-2">
              <span v-if="row.spec.taints && row.spec.taints.length">
                {{ t('node.list.nodeTaint') }}:
                <Tag
                  v-for="(taint, i) in row.spec.taints"
                  :key="i"
                  class="mr-5 mt-2"
                >
                  {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
                </Tag>
              </span>
              <span
                v-if="!!row.customLabelCount"
                class="mt-5"
              > {{ t('node.list.nodeLabels') }}:
                <span
                  v-for="(label, i) in row.customLabels"
                  :key="i"
                  class="mt-5 labels"
                >
                  <Tag
                    v-if="i < 7"
                    class="mr-2 label"
                  >
                    {{ label }}
                  </Tag>
                  <Tag
                    v-else-if="i > 6 && row.displayLabels"
                    class="mr-2 label"
                  >
                    {{ label }}
                  </Tag>
                </span>
                <a
                  v-if="row.customLabelCount > 7"
                  href="#"
                  @click.prevent="toggleLabels(row)"
                >
                  {{ t(`node.list.${row.displayLabels? 'hideLabels' : 'showLabels'}`) }}
                </a>
              </span>
            </td>
          </template>
          <td
            v-else
            :colspan="fullColspan"
          >
&nbsp;
          </td>
        </tr>
      </template>
    </PaginatedResourceTable>
  </div>
</template>

<style lang='scss' scoped>

.labels {
    display: inline;
    flex-wrap: wrap;

    .label {
      display: inline-block;
      margin-top: 2px;
    }

}
.taints {
  td {
    padding-top:0;
    .tag {
      margin-right: 5px;
      display: inline-block;
      margin-top: 2px;
    }
  }
  &.empty-taints {
    // No taints... so hide sub-row (but not bottom-border)
    height: 0;
    line-height: 0;
    td {
      padding: 0;
    }
  }
}

</style>
