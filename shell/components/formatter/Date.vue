<script>
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';

export default {
  props: {
    tagName: {
      type:    String,
      default: 'span',
    },

    value: {
      type:    [String, Date, Number],
      default: ''
    },

    multiline: {
      type:    Boolean,
      default: false,
    },

    emptyTextKey: {
      type:    String,
      default: ''
    },

    showDate: {
      type:    Boolean,
      default: true,
    },

    showTime: {
      type:    Boolean,
      default: true,
    },

  },

  computed: {

    date() {
      if ( !this.value ) {
        return this.emptyTextKey ? this.$store.getters['i18n/t'](this.emptyTextKey) : '';
      }

      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));

      return day(this.value).format(dateFormat);
    },

    time() {
      if ( !this.value ) {
        return '';
      }

      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return day(this.value).format(timeFormat);
    }
  },
};
</script>

<template>
  <component :is="tagName">
    <template v-if="showDate">
      {{ date }}<br v-if="multiline"><span v-else>&nbsp;</span>
    </template>
    <template v-if="showTime">
      {{ time }}
    </template>
  </component>
</template>
