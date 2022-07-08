<script>
import { colorForStatus } from '../../plugins/kubewarden/policy-class';

import { BadgeState } from '@components/BadgeState';

export default {
  components: { BadgeState },

  props:      {
    value: {
      type:     String,
      default: ''
    }
  },

  data() {
    return {
      stateDisplay:    '',
      stateBackground: ''
    };
  },

  watch: {
    value: {
      handler() {
        const color = colorForStatus(this.value);

        this.stateDisplay = this.value;
        this.stateBackground = color.replace('text-', 'bg-');
      },

      immediate: true
    }
  }
};
</script>

<template>
  <div>
    <BadgeState
      v-if="value"
      :color="stateBackground"
      :label="stateDisplay"
    />
  </div>
</template>
