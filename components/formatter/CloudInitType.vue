<script>
import { HCI } from '@/config/labels-annotations';

export default {
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  computed: {
    displayLabel() {
      return this.value?.[HCI.CLOUD_INIT] === 'user' ? 'User Data' : 'Network Data';
    }
  },
};
</script>

<template>
  <span> {{ displayLabel }} </span>
</template>
