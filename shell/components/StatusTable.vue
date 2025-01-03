<script>
import {
  LAST_UPDATED, TYPE, REASON, MESSAGE, STATUS
} from '@shell/config/table-headers';
import SortableTable from '@shell/components/SortableTable';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { exceptionToErrorsArray } from '@shell/utils/error';
export default {
  emits: ['error'],

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

      copyTextToClipboard(this.$slots.default()[0].text).then(() => {
        this.copied = true;

        setTimeout(() => {
          this.copied = false;
        }, 2000);
      }).catch((e) => {
        this.$emit('error', exceptionToErrorsArray(e));
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
