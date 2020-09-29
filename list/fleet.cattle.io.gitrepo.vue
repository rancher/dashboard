<script>
import SortableTable from '@/components/SortableTable';
import ButtonGroup from '@/components/ButtonGroup';
import { get } from '@/utils/object';
import Link from '@/components/formatter/Link';
import Shortened from '@/components/formatter/Shortened';
import { mapPref, GROUP_RESOURCES } from '@/store/prefs';

import {
  AGE,
  STATE,
  NAME,
  WORKSPACE
} from '@/config/table-headers';
import { removeObject } from '@/utils/array';

export default {
  name:       'ListGitRepo',
  components: {
    SortableTable, Link, Shortened, ButtonGroup
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
      const out = [
        STATE,
        NAME,
        WORKSPACE,
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
          name:      'ready',
          labelKey:  'tableHeaders.summary',
          value:     'status.summary',
          sort:      false,
          search:    false,
          formatter: 'FleetSummary',
          width:     100,
        },
        AGE
      ];

      if ( this.groupBy || !this.groupable ) {
        removeObject(out, WORKSPACE);
      }

      return out;
    },

    group: mapPref(GROUP_RESOURCES),

    groupable() {
      return true;
    },

    groupBy() {
      // The value of the preference is "namespace" but we take that to mean group by workspace here...
      if ( this.groupable && this.group === 'namespace') {
        return 'groupByLabel';
      }

      return null;
    },

    groupOptions() {
      return [
        { value: 'none', icon: 'icon-list-flat' },
        { value: 'namespace', icon: 'icon-list-grouped' }
      ];
    },

    pagingParams() {
      return {
        singularLabel: this.$store.getters['type-map/labelFor'](this.schema),
        pluralLabel:   this.$store.getters['type-map/labelFor'](this.schema, 99),
      };
    },
  },

  methods: { get },
};
</script>

<template>
  <SortableTable
    v-bind="$attrs"
    :headers="headers"
    :rows="rows"
    :group-by="groupBy"
    :paging="true"
    paging-label="sortableTable.paging.resource"
    :paging-params="pagingParams"
    key-field="_key"
    v-on="$listeners"
  >
    <template v-if="groupable" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup v-model="group" :options="groupOptions" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div class="group-tab" v-html="thisGroup.ref" />
    </template>

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

    <template #cell:target="{row}">
      {{ row.targetInfo.modeDisplay }}
    </template>
  </SortableTable>
</template>
