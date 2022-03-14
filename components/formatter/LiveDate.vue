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
