<script>
// Added by Verrazzano
import { _VIEW } from '@shell/config/query-params';

// this button fits next to the header at the top of TreeTabbed content

export default {
  name:  'TabDeleteButton',
  props: {
    mode: {
      type:     String,
      required: true,
    },
    elementName: {
      type:     String,
      required: true,
    },
    buttonLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return { tooltipLabel: this.buttonLabel };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },
  created() {
    if (!this.tooltipLabel) {
      this.tooltipLabel = this.t('verrazzano.common.buttons.deleteElement', { element: this.elementName });
    }
  }
};
</script>

<template>
  <button
    v-if="!isView"
    v-tooltip="tooltipLabel"
    type="button"
    class="btn role-link close btn-sm"
    @click="$emit('click', $event)"
  >
    <i class="icon icon-2x icon-x" />
  </button>
</template>
