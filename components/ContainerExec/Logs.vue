<script>
import { saveAs } from 'file-saver';
export default {
  props: { backlog: { type: Array, default: () => [] } },
  data() {
    return { showLast: false };
  },
  computed: {
    prettyLines() {
      return this.backlog.map(line => this.withLocale(line));
    }
  },
  methods:  {
    withLocale(line) {
      const matches = line.match(/^\[?([^ \]]+)\]?\s?/) || [];
      let date, message, localDate;

      if (matches[1] && this.isDate(matches[1]) ) {
        date = new Date(matches[1]);
        message = line.substr(matches[1].length);
        localDate = `${ date.toLocaleDateString() } ${ date.toLocaleTimeString() }`;
      }

      return { localDate, message };
    },
    isDate(date) {
      return new Date(date) !== 'Invalid Date' && !isNaN(new Date(date));
    },
    // toggleLast(e) {
    //   this.$store.dispatch('shell/closeSocket')
    //     .then(() => {
    //       this.$store.dispatch('shell/defineSocket', { showLast: !this.showLast });
    //     });
    // },
    scrollToTop() {
      const viewPort = this.$refs.logs;

      viewPort.scrollTop = 0;
    },
    scrollToBottom() {
      const viewPort = this.$refs.logs;

      viewPort.scrollTop = viewPort.scrollHeight;
    },
    clear() {
      this.$store.commit('shell/clearBacklog');
    },
    download() {
      const blob = new Blob(this.backlog, { type: 'text/plain;charset=utf-8' });
      const fileName = `${ this.$store.state.shell.container.name }.log`;

      saveAs(blob, fileName);
    }
  }
};
</script>

<template>
  <div>
    <div ref="logs" class="logs terminal">
      <div
        v-for="(line, i) in prettyLines"
        :key="`${line}--${i}`"
      >
        <span class="datestring">{{ line.localDate }}</span>{{ line.message }}
      </div>
    </div>
    <div class="controls-bottom">
      <button class="btn btn-sm bg-primary" type="button" @click="scrollToTop">
        Scroll to Top
      </button>
      <button class="btn btn-sm bg-primary" type="button" @click="scrollToBottom">
        Scroll to Bottom
      </button>
      <button class="btn btn-sm bg-primary" @click="clear">
        Clear
      </button>
      <button class="btn btn-sm bg-primary" @click="download">
        Download Logs
      </button>
    </div>
    <!-- <div class="toggle">
      <input id="togglelast" :value="showLast" type="checkbox" @click="toggleLast">
      <label for="togglelast">previous container </label>
    </div> -->
  </div>
</template>

<style scoped lang='scss'>
  .logs{
     height: 80%;
     overflow-y: scroll;
     max-height: 80vh;
     min-height: 500px;
    scroll-behavior: smooth;
    }

   .controls-bottom{
    display: flex;
    justify-content: center;

    & button{
        margin: 5px;
        flex-grow: 0;
      }
    }
  .toggle{
     color: var( --input-label);
  }
</style>
