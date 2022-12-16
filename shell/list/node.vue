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
import { get } from '@shell/utils/object';
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
    const hash = { kubeNodes: this.$fetchType(NODE) };

    this.canViewPods = this.$store.getters[`cluster/schemaFor`](POD);

    if (this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE)) {
      // Required for Drain/Cordon action
      hash.normanNodes = this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
    }

    if (this.$store.getters[`rancher/schemaFor`](NORMAN.NODE)) {
      hash.mgmtNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    }

    if (this.$store.getters[`management/schemaFor`](CAPI.MACHINE)) {
      // Required for ssh / download key actions
      hash.machines = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }

    if (this.canViewPods) {
      // Used for running pods metrics - we don't need to block on this to show the list of nodes
      this.$store.dispatch('cluster/findAll', { type: POD });
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
      return (this.rows || []).some(node => node.status.nodeInfo.operatingSystem === 'windows');
    },
    tableGroup: mapPref(GROUP_RESOURCES),

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
          getValue:   row => row.status?.nodeInfo?.operatingSystem
        },
        {
          ...CPU,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   row => row.cpuUsagePercentage
        }, {
          ...RAM,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   row => row.ramUsagePercentage
        }];

      if (this.canViewPods) {
        headers.push({
          ...PODS,
          breakpoint: COLUMN_BREAKPOINTS.DESKTOP,
          getValue:   row => row.podConsumedUsage
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

    get,

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
      :rows="rows"
      :sub-rows="true"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      v-on="$listeners"
    >
      <template #sub-row="{fullColspan, row, onRowMouseEnter, onRowMouseLeave}">
        <tr
          class="taints sub-row"
          :class="{'empty-taints': !row.spec.taints || !row.spec.taints.length}"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <template v-if="row.spec.taints && row.spec.taints.length">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td :colspan="fullColspan-2">
              {{ t('node.list.nodeTaint') }}:
              <Tag
                v-for="taint in row.spec.taints"
                :key="taint.key + taint.value + taint.effect"
                class="mr-5"
              >
                {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
              </Tag>
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
.taints {
  td {
    padding-top:0;
    .tag {
      margin-right: 5px
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
