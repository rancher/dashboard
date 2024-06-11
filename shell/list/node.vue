<script lang="ts">
import ResourceTable from '@shell/components/ResourceTable.vue';
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
import { allHash } from '@shell/utils/promise';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { COLUMN_BREAKPOINTS } from '@shell/types/store/type-map';

import ResourceFetch from '@shell/mixins/resource-fetch';
import { mapGetters } from 'vuex';

export default defineComponent({
  name:       'ListNode',
  components: {
    ResourceTable,
    Tag,
    Banner
  },
  mixins: [metricPoller, ResourceFetch],

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

  async fetch() {
    this.$initializeFetchData(this.resource);

    await allHash({
      kubeNodes: this.$fetchType(this.resource),
      ...this.fetchSecondaryResources(),
    });
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

  beforeDestroy() {
    // Stop watching pods, nodes and node metrics
    if (this.canViewPods) {
      this.$store.dispatch('cluster/forgetType', POD);
    }

    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
  },

  computed: {
    ...mapGetters(['currentCluster']),
    hasWindowsNodes() {
      // Note if server side pagination is used this is only applicable to the current page
      return (this.rows || []).some((node: any) => node.status.nodeInfo.operatingSystem === 'windows');
    },

    tableGroup: mapPref(GROUP_RESOURCES),

    headers() {
      // This is all about adding the pods column... if the user can see pods

      if (this.canPaginate) {
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
      }

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
  },

  methods: {
    async loadMetrics() {
      if (!this.canViewNodeMetrics) {
        return;
      }

      if (this.canPaginate) {
        if (!this.rows.length) {
          return;
        }

        const opt: ActionFindPageArgs = {
          force:      true,
          pagination: new FilterArgs({
            filters: new PaginationParamFilter({
              fields: this.rows.map((r: any) => new PaginationFilterField({
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
      this.$set(row, 'displayLabels', !row.displayLabels);
    },

    fetchSecondaryResources(): { [key: string]: Promise<any>} {
      if (this.canPaginate) {
        return {};
      }

      const hash: { [key: string]: Promise<any>} = {};

      if (this.canViewMgmtNodes) {
        hash.mgmtNodes = this.$fetchType(MANAGEMENT.NODE, [], 'management');
      }

      if (this.canViewNormanNodes) {
        hash.normanNodes = this.$fetchType(NORMAN.NODE, [], 'rancher');
      }

      if (this.canViewMachines) {
        hash.machines = this.$fetchType(CAPI.MACHINE, [], 'management');
      }

      if (this.canViewPods) {
        // No need to block on this
        this.$fetchType(POD);
      }

      return hash;
    },

    /**
     * Nodes columns need other resources in order to show data in some columns
     *
     * In the paginated world we want to resrict the fetch of those resources to only the one's we need
     *
     * So when we have a page.... use those entries as filters when fetching the other resources
     */
    async fetchPageSecondaryResources(force = false) {
      if (!this.rows?.length) {
        return;
      }

      if (this.canViewMgmtNodes && this.canViewNormanNodes) {
        // We only fetch mgmt node to get norman node. We only fetch node to get node actions
        // See https://github.com/rancher/dashboard/issues/10743
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(this.rows.map((r: any) => new PaginationFilterField({
              field: 'status.nodeName',
              value: r.id
            }))),
          })
        };

        this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.NODE, opt })
          .then(() => {
            this.$store.dispatch(`rancher/findAll`, { type: NORMAN.NODE, opt: { force } });
          });
      }

      if (this.canViewMachines) {
        const namespace = this.currentCluster.provClusterId?.split('/')[0];

        if (namespace) {
          const opt: ActionFindPageArgs = {
            force,
            namespaced: namespace,
            pagination: new FilterArgs({
              filters: PaginationParamFilter.createMultipleFields(
                this.rows.reduce((res: PaginationFilterField[], r: any ) => {
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
              this.rows.map((r: any) => new PaginationFilterField({
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
    <ResourceTable
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :sub-rows="true"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      data-testid="cluster-node-list"
      :external-pagination-enabled="canPaginate"
      :external-pagination-result="paginationResult"
      @pagination-changed="paginationChanged"
      v-on="$listeners"
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
                  v-for="taint in row.spec.taints"
                  :key="taint.key + taint.value + taint.effect"
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
    </ResourceTable>
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
