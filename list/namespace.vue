<script>
import ResourceTable from '@/components/ResourceTable';
import { STATE, NAME, AGE } from '@/config/table-headers';
import { removeObject } from '@/utils/array';

export default {
  name:       'ListNamespace',
  components: { ResourceTable },

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
      const project = {
        name:          'project',
        label:         'Project',
        value:         'project.nameDisplay',
        sort:          ['projectNameSort', 'nameSort'],
      };

      const out = [
        STATE,
        { ...NAME, label: 'Namespace Name' },
        project,
        AGE
      ];

      if ( this.groupBy || !this.groupable ) {
        removeObject(out, project);
      }

      return out;
    },
  },
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="rows"
    :groupable="true"
    group-tooltip="resourceTable.groupBy.project"
    key-field="_key"
    v-on="$listeners"
  >
    <template #cell:project="{row}">
      <span v-if="row.project">{{ row.project.nameDisplay }}</span>
      <span v-else class="text-muted">&ndash;</span>
    </template>
  </ResourceTable>
</template>
