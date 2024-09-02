<script>
import day from 'dayjs';
import { elapsedTime } from '@shell/utils/time';

export default {
  props: {
    value: {
      type:    Object,
      default: () => {}
    },
  },

  mounted() {
    // Set initial value;
    if (this.value.startTime) {
      this.liveUpdate(day());
    }
  },

  data() {
    return { label: '-' };
  },

  computed: {
    dayValue() {
      if (!this.value.startTime) {
        return null;
      }

      return day(this.value.startTime);
    }
  },

  watch: {
    value() {
      if (this.value.startTime) {
        this.liveUpdate(day());
      }
    }
  },

  methods: {
    liveUpdate(now) {
      if (!this.dayValue) {
        this.label = '-';

        return 300;
      }

      const { label, diff } = this.getDuration(this.dayValue, now);

      this.label = label;

      return diff;
    },
    getDuration(value, from) {
      const now = day();

      from = from || now;
      const seconds = Math.abs(value.diff(from, 'seconds'));

      return elapsedTime(seconds);
    },
  }
};
</script>

<template>
  <span v-if="value.staticValue">
    {{ value.staticValue }}
  </span>
  <span
    v-else
    class="live-date"
  >
    {{ label }}
  </span>
</template>
