<script>
import {
  LAST_UPDATED, TYPE, REASON, MESSAGE, STATUS
} from '@shell/config/table-headers';
import SortableTable from '@shell/components/SortableTable';
export default {
  components: { SortableTable },
  props:      {
    resource: {
      type:     Object,
      required: true
    }
  },
  data() {
    const statusHeaders = [
      TYPE,
      STATUS,
      LAST_UPDATED,
      REASON,
      MESSAGE
    ];

    return {
      statusRows: this.resource.status.conditions || [],
      statusHeaders
    };
  },

  methods: {
    clicked($event) {
      $event.stopPropagation();
      $event.preventDefault();

      this.$copyText(this.$slots.default[0].text).then(() => {
        this.copied = true;

        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    },
  }
};
</script>

<template>
  <SortableTable
    :rows="statusRows"
    :headers="statusHeaders"
    :table-actions="false"
    :row-actions="false"
    key-field="key"
    default-sort-by="state"
  />
</template>
