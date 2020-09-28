<script>
import ButtonGroup from '@/components/ButtonGroup';
import SortableTable from '@/components/SortableTable';
import { removeObject } from '@/utils/array';
import { FLEET } from '@/config/types';
import Shortened from '@/components/formatter/Shortened';
import Link from '@/components/formatter/Link';
import {
  AGE,
  STATE,
  NAME,
  WORKSPACE
} from '@/config/table-headers';

export default {
  components: {
    ButtonGroup, SortableTable, Shortened, Link
  },

  props: {
    rows: {
      type:     Array,
      required: true,
    },

    groupable: {
      type:    Boolean,
      default: false,
    },

    group: {
      type:    String,
      default: null,
    },

    groupBy: {
      type:    String,
      default: null,
    },

    groupOptions: {
      type:    Array,
      default: null,
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

    pagingParams() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const schema = this.$store.getters[`${ inStore }/schemaFor`](FLEET.CLUSTER);

      return {
        singularLabel: this.$store.getters['type-map/labelFor'](schema),
        pluralLabel:   this.$store.getters['type-map/labelFor'](schema, 99),
      };
    },
  }
};
</script>

<template>
  <SortableTable
    v-bind="$attrs"
    :headers="headers"
    :rows="rows"
    :group-by="groupBy"
    :paging-params="pagingParams"
    key-field="_key"
    v-on="$listeners"
  >
    <template v-if="groupable" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup :value="group" :options="groupOptions" @input="$emit('set-group', $event)" />
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
        @ <Shortened long-value-key="status.commit" :row="row" :value="row.commitDisplay" />
      </template>
    </template>

    <template #cell:target="{row}">
      {{ row.targetInfo.modeDisplay }}
    </template>
  </SortableTable>
</template>
