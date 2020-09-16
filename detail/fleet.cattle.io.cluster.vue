<script>
import Loading from '@/components/Loading';
import SimpleBox from '@/components/SimpleBox';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import SortableTable from '@/components/SortableTable';
import FleetSummary from '@/components/FleetSummary';
import { MANAGEMENT } from '@/config/types';
import { clone } from '@/utils/object';
import { colorForState } from '@/plugins/steve/resource-instance';

export default {
  name: 'DetailCluster',

  components: {
    Loading,
    BadgeState,
    Banner,
    FleetSummary,
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
  },

  data() {
    return { rancherCluster: null };
  },

  computed: {
    unready() {
      let i = 1;
      const out = clone(this.value.status?.summary?.nonReadyResources || []);

      for ( const res of out ) {
        res.stateBackground = colorForState(res.bundleState).replace('text-', 'bg-');
        res.stateDisplay = res.bundleState;

        for ( const stat of res.modifiedStatus || []) {
          stat.action = ( stat.missing ? 'Create' : ( stat.delete ? 'Remove' : 'Update' ) );
          stat.id = `row${ i++ }`;
        }
      }

      return out;
    },

    unreadyHeaders() {
      return [
        {
          name:  'action',
          value: 'action',
          label: 'Action',
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
          name:  'kind',
          value: 'kind',
          label: 'Resource',
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
    <FleetSummary :value="value.status.summary" />

    <hr class="mt-20 mb-20" />

    <h2 v-t="'fleet.cluster.nonReady'" />
    <SimpleBox v-for="(res, idx) in unready" :key="idx">
      <div class="clearfix">
        <h3 class="inline-block">
          {{ res.name }}
        </h3>
        <BadgeState class="pull-right" :value="res" />
      </div>

      <Banner
        v-if="res.message"
        :color="res.stateBackground.replace(/bg-/, '')"
        :label="res.message"
      />

      <SortableTable
        :rows="res.modifiedStatus"
        :headers="unreadyHeaders"
        :table-actions="false"
        :row-actions="false"
        :search="false"
        key-field="id"
      />
    </SimpleBox>
  </div>
</template>
