<script>
import {
  STATUS,
  LAST_HEARTBEAT_TIME,
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
      LAST_HEARTBEAT_TIME,
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
