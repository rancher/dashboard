<script>
import ResourceTable from '@shell/components/ResourceTable';
import Link from '@shell/components/formatter/Link';
import Shortened from '@shell/components/formatter/Shortened';
import FleetIntro from '@shell/components/fleet/FleetIntro';

import {
  AGE,
  STATE,
  NAME,
  FLEET_SUMMARY
} from '@shell/config/table-headers';

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
    filteredRows() {
      if (!this.rows) {
        return [];
      }

      // Returns boolean { [namespace]: true }
      const selectedWorkspace = this.$store.getters['namespaces']();

      return this.rows.filter((row) => {
        return !!selectedWorkspace[row.metadata.namespace];
      });
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
  methods: {
    parseTargetMode(row) {
      return row.targetInfo?.mode === 'clusterGroup' ? this.t('fleet.gitRepo.warningTooltip.clusterGroup') : this.t('fleet.gitRepo.warningTooltip.cluster');
    }
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
      :rows="rows"
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
        <span v-else class="cluster-count-info">
          {{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}
          <i
            v-if="!row.clusterInfo.total"
            v-tooltip.bottom="parseTargetMode(row)"
            class="icon icon-warning"
          />
        </span>
      </template>

      <template #cell:target="{row}">
        {{ row.targetInfo.modeDisplay }}
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.cluster-count-info {
  display: flex;
  align-items: center;

  i {
    margin-left: 5px;
    font-size: 22px;
    color: var(--warning);
  }
}
</style>
