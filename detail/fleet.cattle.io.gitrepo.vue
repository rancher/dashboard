<script>
import SimpleBox from '@/components/SimpleBox';
import BadgeState from '@/components/BadgeState';
import Banner from '@/components/Banner';
import SortableTable from '@/components/SortableTable';
import ResourceTabs from '@/components/form/ResourceTabs';
import FleetSummary from '@/components/FleetSummary';
import { clone } from '@/utils/object';
import { colorForState } from '@/plugins/steve/resource-instance';
import Tab from '@/components/Tabbed/Tab';
import { FLEET } from '@/config/types';

export default {
  name: 'DetailGitRepo',

  components: {
    BadgeState,
    Banner,
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

      for ( const res of out ) {
        res.stateBackground = colorForState(res.bundleState).replace('text-', 'bg-');
        res.stateDisplay = res.bundleState;

        for ( const stat of res.nonReadyStatus || []) {
          stat.id = `row${ i++ }`;
        }
      }

      return out;
    },

    computedResources() {
      const clusters = this.value.targetClusters || [];
      const resources = this.value.status?.resources || [];
      const out = [];

      for ( const r of resources ) {
        let namespacedName = r.name;

        if ( r.namespace ) {
          namespacedName = `${ r.namespace }:${ r.name }`;
        }

        for ( const c of clusters ) {
          out.push({
            key:       `${ r.id }-${ c.id }-${ r.type }-${ r.namespace }-${ r.name }`,
            kind:      r.type,
            id:        r.id,
            cluster:   c,
            namespace: r.namespace,
            name:      r.name,
            state:     r.state, // @TODO pull state from r.perClusterState
            namespacedName,
          });
        }
      }

      return out;
    },

    resourceHeaders() {
      return [
        {
          name:          'state',
          value:         'state',
          label:         'State',
          formatter:     'BadgeStateFormatter',
          formatterOpts: { arbitrary: true },
          width:         100,
        },
        {
          name:  'cluster',
          value: 'cluster.metadata.name',
          label: 'Cluster',
        },
        {
          name:  'kind',
          value: 'kind',
          label: 'Kind',
        },
        {
          name:  'resource',
          value: 'namespacedName',
          label: 'Resource',
        },
      ];
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
    <FleetSummary :value="value.status.summary" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="All Resources" name="resources" :weight="20">
        <SortableTable
          :rows="computedResources"
          :headers="resourceHeaders"
          :table-actions="false"
          :row-actions="false"
          :search="false"
          key-field="key"
        />
      </Tab>

      <Tab v-if="unready.length" label="Non-Ready" name="unready" :weight="21">
        <SimpleBox v-for="(res, idx) in unready" :key="idx" :class="{'p-0': true, 'mt-20': idx > 0}">
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
            :rows="res.nonReadyStatus"
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
