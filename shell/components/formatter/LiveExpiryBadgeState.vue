<script>
import day from 'dayjs';
import { BadgeState } from '@components/BadgeState';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { safeSetTimeout } from '@shell/utils/time';

export default {
  components:   { BadgeState },
  inheritAttrs: false,
  props:        {
    row: {
      type:    Object,
      default: null,
    },
    class: {
      type:    String,
      default: ''
    }
  },

  data() {
    return { state: this.update() };
  },

  computed: {
    stateValue() {
      return this.state;
    },

    // We do this because we get a linter error vue/no-parsing-error (Parsing error: Unexpected end of expression)
    // because class is a keyword and we can't disable the lint line in the template where it's needed
    className() {
      return this.class;
    }
  },

  watch: {
    row() {
      this.update();
    }
  },

  beforeUnmount() {
    clearTimeout(this.timer);
  },

  methods: {
    update() {
      const state = this.row.state;

      clearTimeout(this.timer);
      if (state !== 'expired' && this.row.expiresAt) {
        // Not expired and has an expiry date, so set a timer to update the state once its expired
        const expiry = day(this.row.expiresAt);
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
  <BadgeState
    :value="stateValue"
    :class="className"
  />
</template>
