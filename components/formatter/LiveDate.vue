<script>
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { escapeHtml } from '@/utils/string';
import { diffFrom } from '@/utils/time';

export default {
  props: {
    value: {
      type:     String,
      default: ''
    },

    addSuffix: {
      type:    Boolean,
      default: false,
    },

    addPrefix: {
      type:    Boolean,
      default: false
    },

    suffix: {
      type:    String,
      default: 'ago',
    },

    tooltipPlacement: {
      type:    String,
      default: 'auto'
    },

    showTooltip: {
      type:    Boolean,
      default: true
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

    suffixedLabel() {
      let out = this.label || '';

      if (out && this.addSuffix) {
        const exists = this.$store.getters['i18n/exists'];
        const suffixKey = `suffix.${ this.suffix }`;
        const suffix = exists(suffixKey) ? this.t(suffixKey) : this.suffix;

        out = `${ out } ${ suffix }`;
      }

      return out;
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
      if ( !this.value || this.value === 'null' ) {
        this.label = null;

        return this.label;
      }

      clearTimeout(this.timer);

      const value = day(this.value);
      const now = day();
      const diff = diffFrom(value, now);
      const prefix = (diff.diff < 0 || !this.addPrefix ? '' : '-');
      const suffix = '';
      let label = diff.label;

      if ( diff === 0 ) {
        label = 'Just now';
      } else {
        label += ` ${ prefix } ${ this.t(diff.unitsKey, { count: diff.label }) } ${ suffix }`;
        label = label.trim();
      }

      if ( this.label !== label ) {
        this.label = label;
      }

      this.timer = setTimeout(() => {
        this.update();
      }, 1000 * diff.next);

      return this.label;
    }
  }
};
</script>

<template>
  <span v-if="!suffixedLabel" class="text-muted">
    &mdash;
  </span>
  <span v-else-if="showTooltip" v-tooltip="{content: title, placement: tooltipPlacement}" class="live-date">
    {{ suffixedLabel }}
  </span>
  <span v-else class="live-date">
    {{ suffixedLabel }}
  </span>
</template>
