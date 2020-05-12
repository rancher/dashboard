<script>
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { escapeHtml } from '@/utils/string';

export default {
  props: {
    tagName: {
      type:    String,
      default: 'span',
    },

    value: {
      type:     String,
      default: ''
    },

    multiline: {
      type:    Boolean,
      default: false,
    }
  },

  computed: {
    date() {
      if ( !this.value ) {
        return '';
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
    {{ date }}<br v-if="multiline" /><span v-else>&nbsp;</span>{{ time }}
  </component>
</template>
