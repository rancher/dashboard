<script>
import day from 'dayjs';

export default {
  props: {
    source: {
      type:    Object,
      default: () => {}
    }
  },

  methods: {
    format(time) {
      if ( !time ) {
        return '';
      }

      return day(time).format(this.timeFormatStr);
    }
  }
};
</script>

<template>
  <div>
    <span v-html="format(source.time)" />
    <span v-html="source.msg" />
  </div>
</template>
