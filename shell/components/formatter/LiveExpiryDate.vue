<script>
import day from 'dayjs';
import { safeSetTimeout } from '@shell/utils/time';

export default {
  props: {
    value: {
      type:    String,
      default: '',
    },
    row: {
      type:    Object,
      default: () => {}
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
      const state = this.row.state;

      clearTimeout(this.timer);
      if (state !== 'expired' && this.value) {
        // Not expired and has an expiry date, so set a timer to update the state once its expired
        const expiry = day(this.value);
        const now = day();
        const timeToExpire = expiry.diff(now);

        this.timer = safeSetTimeout(timeToExpire, this.update, this);
      }

      const out = {};

      out.expiresAt = this.value;
      out.isExpired = state === 'expired';
      this.state = out;

      return out;
    }
  }
};
</script>

<template>
  <span
    v-if="stateValue.isExpired"
    class="text-error"
  >
    <LiveDate
      :value="stateValue.expiresAt"
      :add-suffix="true"
    />
  </span>
  <LiveDate
    v-else-if="stateValue.expiresAt"
    :value="stateValue.expiresAt"
    :add-suffix="false"
  />
  <span
    v-else
    v-t="'generic.never'"
    class="text-muted"
  />
</template>
