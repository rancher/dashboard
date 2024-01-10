<script>
import ResourceTable from '@shell/components/ResourceTable';
import Tag from '@shell/components/Tag';
import { Banner } from '@components/Banner';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM, PODS, AGE, KUBE_NODE_OS
} from '@shell/config/table-headers';
import metricPoller from '@shell/mixins/metric-poller';

import {
  CAPI,
  MANAGEMENT, METRIC, NODE, NORMAN, POD
} from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { COLUMN_BREAKPOINTS } from '@shell/components/SortableTable/index.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
export default {
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
    }
  },

  async fetch() {
    this.$initializeFetchData(this.resource);

    const hash = { kubeNodes: this.$fetchType(this.resource) };

    this.canViewPods = this.$store.getters[`cluster/schemaFor`](POD);

    if (this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE)) {
      // Required for Drain/Cordon action
      hash.normanNodes = this.$fetchType(NORMAN.NODE, [], 'rancher');
    }

    if (this.$store.getters[`rancher/schemaFor`](NORMAN.NODE)) {
      hash.mgmtNodes = this.$fetchType(MANAGEMENT.NODE, [], 'management');
    }

    if (this.$store.getters[`management/schemaFor`](CAPI.MACHINE)) {
      // Required for ssh / download key actions
      hash.machines = this.$fetchType(CAPI.MACHINE, [], 'management');
    }

    if (this.canViewPods) {
      // Used for running pods metrics - we don't need to block on this to show the list of nodes
      this.$fetchType(POD);
    }

    await allHash(hash);
  },

  data() {
    return { canViewPods: false };
  },

  beforeDestroy() {
    // Stop watching pods, nodes and node metrics
    this.$store.dispatch('cluster/forgetType', POD);
    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
  },

  computed: {
    hasWindowsNodes() {
      return (this.rows || []).some((node) => node.status.nodeInfo.operatingSystem === 'windows');
    },

    tableGroup: mapPref(GROUP_RESOURCES),

    parsedRows() {
      this.rows.forEach((row) => {
        row.displayTaintsAndLabels = (row.spec.taints && row.spec.taints.length) || !!row.customLabelCount;
      });

      return this.rows;
    },

    headers() {
      const headers = [
        STATE,
        NAME,
        ROLES,
        VERSION,
        INTERNAL_EXTERNAL_IP,
        {
          ...KUBE_NODE_OS,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.status?.nodeInfo?.operatingSystem
        },
        {
          ...CPU,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.cpuUsagePercentage
        }, {
          ...RAM,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.ramUsagePercentage
        }];

      if (this.canViewPods) {
        headers.push({
          ...PODS,
          breakpoint: COLUMN_BREAKPOINTS.DESKTOP,
          getValue:   (row) => row.podConsumedUsage
        });
      }
      headers.push(AGE);

      return headers;
    },
  },

  methods: {
    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('cluster/findAll', {
          type: METRIC.NODE,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    },

    toggleLabels(row) {
      this.$set(row, 'displayLabels', !row.displayLabels);
    },
  }

};
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
      :rows="parsedRows"
      :sub-rows="true"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      data-testid="cluster-node-list"
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
