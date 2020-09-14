<script>
import ResourceTable from '@/components/ResourceTable';
import { get } from '@/utils/object';
import Link from '@/components/formatter/Link';
import Shortened from '@/components/formatter/Shortened';
import {
  AGE,
  STATE,
  NAMESPACE_NAME,
} from '@/config/table-headers';

export default {
  name:       'ListGitRepo',
  components: {
    ResourceTable, Link, Shortened
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },

  computed: {
    headers() {
      return [
        STATE,
        NAMESPACE_NAME,
        {
          name:          'repo',
          labelKey:      'tableHeaders.repo',
          value:         'repoDisplay',
          sort:          'repoDisplay',
          search:        ['spec.repo', 'status.commit'],
        },
        {
          name:     'target',
          labelKey: 'tableHeaders.target',
          value:    'targetInfo.modeDisplay',
          sort:     ['targetInfo.modeDisplay', 'targetInfo.cluster', 'targetInfo.clusterGroup'],
        },
        {
          name:          'ready',
          labelKey:      'tableHeaders.ready',
          value:         'status.summary',
          sort:          false,
          search:        false,
          formatter:     'FleetSummary',
          width:         100,
        },
        AGE
      ];
    },
  },

  methods: { get },

};
</script>

<template>
  <div>
    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      :schema="schema"
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
          @ <Shortened long-value-key="status.commit" :row="row" :value="row.commitDisplay" />
        </template>
      </template>

      <template #cell:target="{row}">
        <template v-if="row.targetInfo.mode === 'cluster'">
          Cluster: {{ row.targetInfo.cluster }}
        </template>
        <template v-else-if="row.targetInfo.mode === 'clusterGroup'">
          Group: {{ row.targetInfo.clusterGroup }}
        </template>
        <template v-else-if="row.targetInfo.mode === 'local'">
          Local
        </template>
        <template v-else>
          Advanced
        </template>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
  ::v-deep .sub-row TD {
    padding: 5px 0;
  }

  ::v-deep .sub-spacer TD {
    padding: 0;
    height: 0;
  }
</style>
