<script>
import { BadgeState } from '@components/BadgeState';
import { stateDisplay } from '@shell/plugins/dashboard-store/resource-class';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    }
  },

  components: { BadgeState },

  data() {
    const STATES = {
      cached: {
        color: 'info', icon: 'dot-open', label: 'Cached', compoundIcon: 'checkmark'
      },
      pending: {
        color: 'warning', icon: 'tag', label: 'In Progress', compoundIcon: 'info'
      },
      disabled: {
        color: 'error', icon: 'dot-half', label: 'Cache Disabled', compoundIcon: 'info'
      },
    };

    return {
      STATES,
      stateDisplay:    '',
      stateBackground: ''
    };
  },

  watch: {
    value: {
      handler() {
        const out = this.value || 'pending';
        const color = this.colorForState(out);

        this.stateDisplay = stateDisplay(out);
        this.stateBackground = color.replace('text-', 'bg-');
      },
      immediate: true
    }
  },

  methods: {
    colorForState(state) {
      const key = (state).toLowerCase();
      let color;

      if ( this.STATES[key] && this.STATES[key].color ) {
        color = this.STATES[key].color;
      }

      if ( !color ) {
        color = 'info';
      }

      return `text-${ color }`;
    }
  }
};
</script>

<template>
  <div>
    <BadgeState
      :color="stateBackground"
      :label="stateDisplay"
    />
  </div>
</template>
