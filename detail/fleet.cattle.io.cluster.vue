<script>
import Loading from '@/components/Loading';
import SimpleBox from '@/components/SimpleBox';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import SortableTable from '@/components/SortableTable';
import FleetSummary from '@/components/FleetSummary';
import FleetRepos from '@/components/FleetRepos';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';
import { MANAGEMENT, FLEET } from '@/config/types';
import { clone } from '@/utils/object';
import { colorForState } from '@/plugins/steve/resource-instance';

export default {
  name: 'DetailCluster',

  components: {
    Loading,
    BadgeState,
    Banner,
    FleetSummary,
    FleetRepos,
    ResourceTabs,
    Tab,
    SimpleBox,
    SortableTable,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rancherCluster = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.CLUSTER,
      id:   this.$route.params.id
    });

    this.allRepos = await this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO });

    await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
  },

  data() {
    return { rancherCluster: null, allRepos: [] };
  },

  computed: {
    unready() {
      let i = 1;
      const out = clone(this.value.status?.summary?.nonReadyResources || []);

      for ( const res of out ) {
        res.stateBackground = colorForState(res.bundleState).replace('text-', 'bg-');
        res.stateDisplay = res.bundleState;

        for ( const stat of res.nonReadyStatus || []) {
          stat.id = `row${ i++ }`;
        }
      }

      return out;
    },

    repos() {
      return this.allRepos.filter((x) => {
        return x.targetClusters.includes(this.value);
      });
    },

    unreadyHeaders() {
      return [
        {
          name:          'state',
          value:         'summary.State',
          label:         'State',
          formatter:     'BadgeStateFormatter',
          formatterOpts: { arbitrary: true }
        },
        {
          name:  'kind',
          value: 'kind',
          label: 'Resource',
        },
        // {
        //   name:  'apiVersion',
        //   value: 'apiVersion',
        //   label: 'API Version',
        // },
        {
          name:  'namespace',
          value: 'namespace',
          label: 'Namespace',
        },
        {
          name:  'name',
          value: 'name',
          label: 'Name',
        },
      ];
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h2 v-t="'fleet.cluster.summary'" class="mt-20" />
    <FleetSummary :value="value.status.resourceCounts" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Non-Ready" name="nonReady" :weight="20">
        <SimpleBox v-for="(res, idx) in unready" :key="idx">
          <div class="clearfix">
            <h3 class="inline-block">
              {{ res.name }}
            </h3>
            <BadgeState class="ml-10" :value="res" />
          </div>

          <Banner
            v-if="res.message"
            :color="res.stateBackground.replace(/bg-/, '')"
            :label="res.message"
          />

          <SortableTable
            :rows="res.nonReadyStatus"
            :headers="unreadyHeaders"
            :table-actions="false"
            :row-actions="false"
            :search="false"
            key-field="id"
          />
        </SimpleBox>
      </Tab>

      <Tab label="Git Repos" name="repos" :weight="19">
        <FleetRepos
          :rows="repos"
          :paging="true"
          paging-label="sortableTable.paging.resource"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
