<script>
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { escapeHtml } from '@/utils/string';

export default {
  props: {
    value: {
      type:     String,
      default: ''
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
  <span>
    {{ date }}<br />{{ time }}
  </span>
</template>
