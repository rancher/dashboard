<script>
import SortableTable from '@shell/components/SortableTable';

export default {
  components: { SortableTable },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed: {
    headers() {
      return [
        {
          name:        'condition',
          labelKey:    'tableHeaders.condition',
          value:       'condition',
          width:       150,
          sort:        'condition',
          dashIfEmpty: true,
        },
        {
          name:        'status',
          labelKey:    'tableHeaders.status',
          value:       'status',
          width:       75,
          sort:        'status',
          dashIfEmpty: true,
        },
        {
          name:          'time',
          labelKey:      'tableHeaders.updated',
          value:         'time',
          sort:          'time',
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          width:         125,
          dashIfEmpty:   true,
        },
        {
          name:        'message',
          labelKey:    'tableHeaders.message',
          value:       'message',
          sort:        ['message'],
          dashIfEmpty: true,
        },
      ];
    },

    rows() {
      return (this.value.status?.conditions || []).map((cond) => {
        let message = cond.message || '';

        if ( cond.reason ) {
          message = `[${ cond.reason }] ${ message }`.trim();
        }

        return {
          condition: cond.type || 'Unknown',
          status:    cond.status || 'Unknown',
          error:     cond.error,
          time:      cond.lastProbeTime || cond.lastUpdateTime || cond.lastTransitionTime,
          message,
        };
      });
    },
  }
};
</script>

<template>
  <SortableTable
    :headers="headers"
    :rows="rows"
    key-field="condition"
    default-sort-by="condition"
    :table-actions="false"
    :row-actions="false"
    :search="false"
  >
    <template #cell:condition="{row}">
      <span :class="{'text-error': row.error}">{{ row.condition }}</span>
    </template>

    <template #cell:status="{row}">
      <span :class="{'text-error': row.error}">{{ row.status }}</span>
    </template>
  </SortableTable>
</template>
