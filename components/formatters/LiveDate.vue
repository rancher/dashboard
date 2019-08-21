<script>
import moment from 'moment';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { escapeHtml } from '@/utils/string';

export default {
  props: {
    value: {
      type:     String,
      required: true
    }
  },

  data() {
    return { label: this.update() };
  },

  computed: {
    title() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return moment(this.value).format(`${ dateFormat } ${ timeFormat }`);
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

      const value = moment(this.value);
      const now = moment();
      const diff = Math.abs(value.diff(now, 'seconds'));
      let next = 1;

      clearTimeout(this.timer);

      if ( diff < 60 ) {
        if ( diff === 0 ) {
          this.label = 'Just now';
        } else if ( diff === 1 ) {
          this.label = '1 second ago';
        } else {
          this.label = `${ diff } seconds ago`;
        }
      } else {
        this.label = value.fromNow();

        if ( diff < 600 ) {
          next = 5;
        } else {
          next = 60;
        }
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
