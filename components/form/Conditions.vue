<script>
import {
  STATUS,
  REASON,
  MESSAGE
} from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';

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
  data() {
    const statusTableHeaders = [
      {
        name:  'type',
        label: 'Type',
        value: 'type',
        sort:  'type',
        width: 100,
      },
      STATUS,
      {
        name:          'lastUpdated',
        label:         'Last Update',
        value:         'lastTransitionTime',
        sort:          ['lastTransitionTime'],
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
      },
      REASON,
      MESSAGE
    ];

    return { statusTableHeaders };
  }
};
</script>

<template>
  <div>
    <SortableTable :headers="statusTableHeaders" :rows="(value.status||{}).conditions || []" key-field="message" :row-actions="false" :search="false" />
  </div>
</template>
