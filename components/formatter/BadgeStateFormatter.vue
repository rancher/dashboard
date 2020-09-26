<script>
import BadgeState from '@/components/BadgeState';
import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';
export default {
  components: { BadgeState },
  props:      {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },

    arbitrary: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const out = {};

    if (this.arbitrary) {
      const color = colorForState(this.value);

      out.stateDisplay = stateDisplay(this.value);
      out.stateBackground = color.replace('text-', 'bg-');
    }

    return out;
  }
};
</script>

<template>
  <div>
    <BadgeState v-if="arbitrary" :color="stateBackground" :label="stateDisplay" />
    <BadgeState v-else :value="row" />
  </div>
</template>
