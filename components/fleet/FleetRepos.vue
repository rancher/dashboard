<script>
import ResourceTable from '@/components/ResourceTable';
import Link from '@/components/formatter/Link';
import FleetIntro from '@/components/fleet/FleetIntro';
import Shortened from '@/components/formatter/Shortened';
import { NAME as HARVESTER } from '@/config/product/harvester';
import { mapGetters } from 'vuex';

import {
  AGE,
  STATE,
  NAME,
  FLEET_SUMMARY
} from '@/config/table-headers';

export default {
  name: 'FleetRepos',

  components: {
    ResourceTable, Link, Shortened, FleetIntro
  },
  props: {
    rows: {
      type:     Array,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters(['isVirtualCluster']),
    filteredRows() {
      const isAll = this.$store.getters['isAllNamespaces'];
      const isVirutalProduct = this.$store.getters['currentProduct'].name === HARVESTER;

      // If the resources isn't namespaced or we want ALL of them, there's nothing to do.
      if ( (!this.isNamespaced || isAll) && !isVirutalProduct) {
        return this.rows || [];
      }

      const includedNamespaces = this.$store.getters['namespaces']();

      // Shouldn't happen, but does for resources like management.cattle.io.preference
      if (!this.rows) {
        return [];
      }

      return this.rows.filter((row) => {
        if (this.isVirtualCluster && this.isNamespaced) {
          return !!includedNamespaces[row.metadata.namespace] && !row.isSystemResource;
        } else if (!this.isNamespaced) {
          return true;
        } else {
          return !!includedNamespaces[row.metadata.namespace];
        }
      });
    },
    isNamespaced() {
      return this.schema?.attributes?.namespaced || false;
    },
    noRows() {
      return !this.filteredRows.length;
    },
    headers() {
      const out = [
        STATE,
        NAME,
        {
          name:     'repo',
          labelKey: 'tableHeaders.repo',
          value:    'repoDisplay',
          sort:     'repoDisplay',
          search:   ['spec.repo', 'status.commit'],
        },
        {
          name:     'target',
          labelKey: 'tableHeaders.target',
          value:    'targetInfo.modeDisplay',
          sort:     ['targetInfo.modeDisplay', 'targetInfo.cluster', 'targetInfo.clusterGroup'],
        },
        {
          name:      'clustersReady',
          labelKey:  'tableHeaders.clustersReady',
          value:     'status.readyClusters',
          sort:      'status.readyClusters',
          search:    false,
        },
        FLEET_SUMMARY,
        AGE
      ];

      return out;
    },
  },
};
</script>

<template>
  <div>
    <FleetIntro v-if="noRows" />
    <ResourceTable
      v-if="!noRows"
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="filteredRows"
      key-field="_key"
      v-on="$listeners"
    >
      <template #cell:repo="{row}">
        <Link
          :row="row"
          :value="row.spec.repo"
          label-key="repoDisplay"
          before-icon-key="repoIcon"
          url-key="spec.repo"
        />
        <template v-if="row.commitDisplay">
          <div class="text-muted">
            <Shortened long-value-key="status.commit" :row="row" :value="row.commitDisplay" />
          </div>
        </template>
      </template>

      <template #cell:clustersReady="{row}">
        <span v-if="!row.clusterInfo" class="text-muted">&mdash;</span>
        <span v-else-if="row.clusterInfo.unready" class="text-warning">{{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}</span>
        <span v-else>{{ row.clusterInfo.total }}</span>
      </template>

      <template #cell:target="{row}">
        {{ row.targetInfo.modeDisplay }}
      </template>
    </ResourceTable>
  </div>
</template>
