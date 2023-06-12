<script>
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';

export default {
  props: {
    source: {
      type:    Object,
      default: () => {}
    }
  },

  computed: {
    timeFormatStr() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return `${ dateFormat } ${ timeFormat }`;
    },
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
  <div class="line">
    <span class="time">{{ format(source.time) }}</span>
    <span
      v-clean-html="source.msg"
      class="msg"
    />
  </div>
</template>

<style lang='scss' scoped>
.line {
  font-family: Menlo,Consolas,monospace;
  color: var(--logs-text);
  display:flex;
}

.time {
  white-space: nowrap;
  display: none;
  width: 0;
  padding-right: 15px;
  user-select: none;
}

.msg {
  white-space: pre;

  .highlight {
    color: var(--logs-highlight);
    background-color: var(--logs-highlight-bg);
  }
}

</style>
