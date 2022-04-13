<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Tag from '@shell/components/Tag';
import Banner from '@shell/components/Banner';
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

export default {
  name:       'ListNode',
  components: {
    Loading,
    ResourceTable,
    Tag,
    Banner
  },
  mixins: [metricPoller],

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = { kubeNodes: this.$store.dispatch('cluster/findAll', { type: NODE }) };

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
      // Used for running pods metrics
      hash.pods = this.$store.dispatch('cluster/findAll', { type: POD });
    }

    const res = await allHash(hash);

    this.kubeNodes = res.kubeNodes;
  },

  data() {
    return {
      kubeNodes:   null,
      canViewPods: false,
    };
  },

  computed: {
    hasWindowsNodes() {
      return (this.kubeNodes || []).some(node => node.status.nodeInfo.operatingSystem === 'windows');
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
          value:      row => row.status?.nodeInfo?.operatingSystem
        },
        {
          ...CPU,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          value:      row => row.cpuUsagePercentage
        }, {
          ...RAM,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          value:      row => row.ramUsagePercentage
        }];

      if (this.canViewPods) {
        headers.push({
          ...PODS,
          breakpoint: COLUMN_BREAKPOINTS.DESKTOP,
          value:      row => row.podConsumedUsage
        });
      }
      headers.push(AGE);

      return headers;
    },

  },

  methods:  {
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
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      v-if="hasWindowsNodes"
      color="info"
      :label="t('cluster.custom.registrationCommand.windowsWarning')"
    />
    <ResourceTable
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="kubeNodes"
      :sub-rows="true"
      v-on="$listeners"
    >
      <template #sub-row="{fullColspan, row}">
        <tr class="taints sub-row" :class="{'empty-taints': !row.spec.taints || !row.spec.taints.length}">
          <template v-if="row.spec.taints && row.spec.taints.length">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td :colspan="fullColspan-2">
              {{ t('node.list.nodeTaint') }}:
              <Tag v-for="taint in row.spec.taints" :key="taint.key + taint.value + taint.effect" class="mr-5">
                {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
              </Tag>
            </td>
          </template>
          <td v-else :colspan="fullColspan">
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
