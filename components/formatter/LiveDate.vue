<script>
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { escapeHtml } from '@/utils/string';

const FACTORS = [60, 60, 24];
const LABELS = ['sec', 'min', 'hour', 'day'];
const PLURALIZE = [false, false, true, true];

export default {
  props: {
    value: {
      type:     String,
      default: ''
    }
  },

  data() {
    return { label: this.update() };
  },

  computed: {
    title() {
      if ( !this.value ) {
        return '';
      }

      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      const out = day(this.value).format(`${ dateFormat } ${ timeFormat }`);

      return out;
    },
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
      if ( !this.value ) {
        this.label = 'n/a';

        return this.label;
      }

      const value = day(this.value);
      const now = day();
      let diff = value.diff(now, 'seconds');
      const prefix = (diff < 0 ? '' : '-');
      const suffix = '';

      diff = Math.abs(diff);

      let next = 1;
      let label = '?';

      clearTimeout(this.timer);

      if ( diff === 0 ) {
        label = 'Just now';
      } else {
        let i = 0;

        while ( diff > FACTORS[i] && i < FACTORS.length ) {
          diff /= FACTORS[i];
          next *= Math.floor(FACTORS[i] / 10);
          i++;
        }

        if ( diff < 10 ) {
          label = Math.floor(diff * 10) / 10;
        } else {
          label = Math.floor(diff);
        }

        label += ` ${ prefix } ${ LABELS[i] }${ label === 1 || !PLURALIZE[i] ? '' : 's' } ${ suffix }`;
        label = label.trim();
      }

      if ( this.label !== label ) {
        this.label = label;
      }

      this.timer = setTimeout(() => {
        this.update();
      }, 1000 * next);

      return this.label;
    }
  }
};
</script>

<template>
  <span v-tooltip="title">
    {{ label }}
  </span>
</template>
