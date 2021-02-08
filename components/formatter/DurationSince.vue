<script>
import day from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import date from '@/components/formatter/Date';

export default {

  mixins: [date],
  props:  {
    value: {
      type:     [String, Date],
      default: ''
    },
    missing: {
      type:    String,
      default: ''
    }
  },

  computed: {
    since() {
      if ( !this.value ) {
        return this.missing || this.t('generic.na');
      }

      return day(this.value).fromNow();
    },
    dateTime() {
      return this.value ? `${ this.date } ${ this.time }` : '';
    }

  },

  created() {
    day.extend(relativeTime);
  },
};
</script>

<template>
  <div>
    <span v-tooltip="dateTime">
      {{ since }}
    </span>
  </div>
</template>
