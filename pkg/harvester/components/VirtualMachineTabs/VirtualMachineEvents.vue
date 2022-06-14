<script>
import { REASON } from '@shell/config/table-headers';
import SortableTable from '@shell/components/SortableTable';

export default {
  name: 'VirtualMachineEvents',

  components: { SortableTable },

  props: {
    events: {
      type:     Array,
      required: true,
    },
  },

  data() {
    const reason = {
      ...REASON,
      canBeVariable: true,
      width:         180
    };

    const eventHeaders = [
      reason,
      {
        name:          'resource',
        label:         'Resource',
        labelKey:      'clusterIndexPage.sections.events.resource.label',
        value:         'displayInvolvedObject',
        sort:          ['involvedObject.kind', 'involvedObject.name'],
        canBeVariable: true,
      },
      {
        align:         'right',
        name:          'date',
        label:         'Date',
        labelKey:      'clusterIndexPage.sections.events.date.label',
        value:         'lastTimestamp',
        sort:          'lastTimestamp:desc',
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
        width:         125,
        defaultSort:   true,
      },
    ];

    return { eventHeaders };
  },

};
</script>

<template>
  <SortableTable
    :rows="events"
    :headers="eventHeaders"
    key-field="id"
    :search="false"
    :table-actions="false"
    :row-actions="false"
    :paging="true"
    :rows-per-page="10"
    default-sort-by="date"
  >
    <template #cell:resource="{row, value}">
      <div class="text-info">
        {{ value }}
      </div>
      <div v-if="row.message">
        {{ row.displayMessage }}
      </div>
    </template>
  </SortableTable>
</template>
