<script>
import day from 'dayjs';

/**
 * return { diff: number; label: string }
 *
 * diff:  update frequency in seconds
 * label: content of the cell's column
 */
function elapsedTime(seconds) {
  if (!seconds) {
    return {};
  }

  if (seconds < 120) {
    return { label: `${ seconds }s` };
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 10) {
    return { label: `${ minutes }m${ seconds - (minutes * 60) }s` };
  }

  const hours = Math.floor(seconds / 3600);

  if (hours < 3) {
    return {
      diff:  60,
      label: `${ minutes }m`,
    };
  }

  return {
    diff:  60,
    label: `${ hours }h${ minutes - (hours * 60) }m`,
  };
}

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
      const seconds = Math.abs(value.diff(now, 'seconds'));

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
