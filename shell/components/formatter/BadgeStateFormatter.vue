<script>
import { BadgeState } from '@components/BadgeState';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
export default {
  components: { BadgeState },
  props:      {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:    Object,
      default: () => {}
    },

    arbitrary: {
      type:    Boolean,
      default: false
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
        if (this.arbitrary) {
          const color = colorForState(this.value);

          this.stateDisplay = stateDisplay(this.value);
          this.stateBackground = color.replace('text-', 'bg-');
        }
      },
      immediate: true
    }
  }
};
</script>

<template>
  <div>
    <div v-if="arbitrary">
      <BadgeState
        v-if="value"
        :color="stateBackground"
        :label="stateDisplay"
      />
    </div>
    <BadgeState
      v-else
      :value="row"
    />
  </div>
</template>
