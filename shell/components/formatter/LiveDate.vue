<script>
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import { diffFrom } from '@shell/utils/time';

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

  mounted() {
    // Set initial value;
    this.liveUpdate(day());
  },

  data() {
    return { label: '-' };
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
      if (!this.value) {
        // If there is no value, then do not show the suffix
        return this.label;
      }

      let out = this.label || '';

      if (out && this.addSuffix) {
        const exists = this.$store.getters['i18n/exists'];
        const suffixKey = `suffix.${ this.suffix }`;
        const suffix = exists(suffixKey) ? this.t(suffixKey) : this.suffix;

        out = `${ out } ${ suffix }`;
      }

      return out;
    },

    dayValue() {
      if (!this.value) {
        return null;
      }

      return day(this.value);
    }
  },

  watch: {
    value() {
      this.liveUpdate(day());
    }
  },

  methods: {
    liveUpdate(now) {
      if (!this.dayValue) {
        if (this.label !== '-') {
          this.label = '-';
        }

        return 300;
      }

      const diff = diffFrom(this.dayValue, now);
      const prefix = (diff.diff < 0 || !this.addPrefix ? '' : '-');

      let label = diff.label;

      if ( diff === 0 ) {
        label = 'Just now';
      } else {
        label += ` ${ prefix } ${ this.t(diff.unitsKey, { count: diff.label }) }`;
        label = label.trim();
      }

      if ( this.label !== label ) {
        this.label = label;
      }

      return diff.next || 1;
    },
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
