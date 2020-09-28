<script>
import SimpleBox from '@/components/SimpleBox';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import SortableTable from '@/components/SortableTable';
import ResourceTabs from '@/components/form/ResourceTabs';
import FleetSummary from '@/components/FleetSummary';
import FleetResources from '@/components/FleetResources';
import { clone } from '@/utils/object';
import { colorForState, stateDisplay, stateSort } from '@/plugins/steve/resource-instance';
import Tab from '@/components/Tabbed/Tab';
import { FLEET } from '@/config/types';

export default {
  name: 'DetailGitRepo',

  components: {
    BadgeState,
    Banner,
    FleetResources,
    FleetSummary,
    SimpleBox,
    SortableTable,
    ResourceTabs,
    Tab,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
  },

  computed: {
    unready() {
      let i = 1;
      const out = clone(this.value.status?.summary?.nonReadyResources || []);

      for ( const bundle of out ) {
        const bundleState = bundle?.bundleState || 'unknown';

        bundle.stateBackground = colorForState(bundleState).replace('text-', 'bg-');
        bundle.stateDisplay = stateDisplay(bundleState);
        bundle.stateSort = stateSort(bundle.stateBackground, bundle.stateDisplay);

        for ( const entry of bundle.nonReadyStatus || []) {
          const state = entry.summary?.state || entry.summary?.State || 'unknown';

          entry.id = `row${ i++ }`;
          entry.stateBackground = colorForState(state).replace('text-', 'bg-');
          entry.stateDisplay = stateDisplay(state);
          entry.stateSort = stateSort(entry.stateBackground, entry.stateDisplay);
        }
      }

      return out;
    },

    unreadyHeaders() {
      return [
        {
          name:          'state',
          value:         'summary.State',
          label:         'State',
          formatter:     'BadgeStateFormatter',
          formatterOpts: { arbitrary: true },
          width:         100,
        },
        // {
        //   name:  'apiVersion',
        //   value: 'apiVersion',
        //   label: 'API Version',
        // },
        {
          name:  'kind',
          value: 'kind',
          label: 'Resource',
          width: '33%',
        },
        {
          name:  'namespace',
          value: 'namespace',
          label: 'Namespace',
          width: '33%',
        },
        {
          name:  'name',
          value: 'name',
          label: 'Name',
          width: '34%',
        },
      ];
    }
  },
};
</script>

<template>
  <div class="mt-20">
    <FleetSummary :value="value.status.resourceCounts" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="All Resources" name="resources" :weight="20">
        <FleetResources :value="value" />
      </Tab>

      <Tab v-if="unready.length" label="Non-Ready" name="unready" :weight="21">
        <SimpleBox v-for="(bundle, idx) in unready" :key="idx" :class="{'p-0': true, 'mt-20': idx > 0}">
          <div>
            <h3 class="inline-block">
              Bundle: {{ bundle.name }}
            </h3>
            <BadgeState :value="bundle" />
          </div>

          <Banner
            v-if="bundle.message"
            :color="bundle.stateBackground.replace(/bg-/, '')"
            :label="bundle.message"
          />

          <SortableTable
            :rows="bundle.nonReadyStatus"
            :headers="unreadyHeaders"
            :table-actions="false"
            :row-actions="false"
            :search="false"
            key-field="id"
          />
        </SimpleBox>
      </Tab>
    </ResourceTabs>
  </div>
</template>
