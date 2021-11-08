<script>
import day from 'dayjs';
import BadgeState from '@/components/BadgeState';
import { safeSetTimeout } from '@/utils/time';
import { colorForState, stateDisplay } from '@/plugins/core-store/resource-instance';

export default {
  components: { BadgeState },

  props: {
    value: {
      type:    Object,
      default: null,
    },
  },

  data() {
    return { state: this.update() };
  },

  computed: {
    stateValue() {
      return this.state;
    }
  },

  watch: {
    value() {
      this.update();
    }
  },

  beforeDestroy() {
    clearTimeout(this.timer);
  },

  methods: {
    update() {
      const state = this.value.state;

      clearTimeout(this.timer);
      if (state !== 'expired' && this.value.expiresAt) {
        // Not expired and has an expiry date, so set a timer to update the state once its expired
        const expiry = day(this.value.expiresAt);
        const now = day();
        const timeToExpire = expiry.diff(now);

        this.timer = safeSetTimeout(timeToExpire, this.update, this);
      }

      const out = {};
      const color = colorForState(state);

      out.stateDisplay = stateDisplay(state);
      out.stateBackground = color.replace('text-', 'bg-');
      this.state = out;

      return out;
    }
  }
};
</script>

<template>
  <BadgeState :value="stateValue" />
</template>
