<script>

import SortableTable from '@shell/components/SortableTable';
import { REASON } from '@shell/config/table-headers';
import { EVENT } from '@shell/config/types';
import { fetchClusterResources } from './explorer-utils';

export default {
  components: { SortableTable },

  async fetch() {
    this.events = await fetchClusterResources(this.$store, EVENT);
  },

  data() {
    const reason = {
      ...REASON,
      ...{ canBeVariable: true },
      width: 130,
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
        name:        'date',
        label:       'Date',
        labelKey:    'clusterIndexPage.sections.events.date.label',
        value:       'timestamp',
        sort:        'timestamp:desc',
        formatter:   'Date',
        width:       220,
        defaultSort: true,
      },
    ];

    return {
      events: [],
      eventHeaders,
    };
  }
};
</script>

<template>
  <SortableTable
    :loading="$fetchState.pending"
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
      <n-link :to="row.detailLocation">
        {{ value }}
      </n-link>
      <div v-if="row.message">
        {{ row.displayMessage }}
      </div>
    </template>
  </SortableTable>
</template>
