<script>
import { saveAs } from 'file-saver';
import AnsiUp from 'ansi_up';
import Window from './Window';
import { addParams } from '@/utils/url';
import { base64Decode } from '@/utils/crypto';
import { LOGS_RANGE, LOGS_TIME, LOGS_WRAP } from '@/store/prefs';
import DateFormatter from '@/components/formatter/Date';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';
import AsyncButton from '@/components/AsyncButton';

import { escapeRegex } from '@/utils/string';

import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@/utils/socket';

let lastId = 1;
const ansiup = new AnsiUp();

export default {
  components: {
    Window, LabeledSelect, Checkbox, DateFormatter, AsyncButton
  },

  props:      {
    // The definition of the tab itself
    tab: {
      type:     Object,
      required: true,
    },

    // Is this tab currently displayed
    active: {
      type:     Boolean,
      required: true,
    },

    // The height of the window
    height: {
      type:     Number,
      required: true,
    },

    // The pod to connect to
    pod: {
      type:     Object,
      required: true,
    },

    // The container in the pod to initially show
    initialContainer: {
      type:    String,
      default: null,
    }
  },

  data() {
    return {
      container:   this.initialContainer || this.pod.defaultContainerName,
      socket:      null,
      isOpen:      false,
      isFollowing: true,
      timestamps:  this.$store.getters['prefs/get'](LOGS_TIME),
      wrap:        this.$store.getters['prefs/get'](LOGS_WRAP),
      range:       this.$store.getters['prefs/get'](LOGS_RANGE),
      previous:    false,
      search:      '',
      backlog:     [],
      lines:       [],
    };
  },

  computed: {
    containerChoices() {
      return this.pod.spec.containers.map(x => x.name);
    },

    rangeOptions() {
      const out = [];
      const t = this.$store.getters['i18n/t'];

      const current = this.range;
      let found = false;
      let value;
      const lines = [1000, 10000, 100000];
      const minutes = [1, 15, 30];
      const hours = [1, 12, 24];

      for ( const x of lines ) {
        value = `${ x } lines`;
        out.push({
          label: t('wm.containerLogs.range.lines', { value: x }),
          value,
        });
      }

      for ( const x of minutes ) {
        value = `${ x } minutes`;
        out.push({
          label: t('wm.containerLogs.range.minutes', { value: x }),
          value
        });
        updateFound(value);
      }

      for ( const x of hours ) {
        value = `${ x } hours`;
        out.push({
          label: t('wm.containerLogs.range.hours', { value: x }),
          value,
        });
        updateFound(value);
      }

      out.push({
        label: t('wm.containerLogs.range.all'),
        value: 'all'
      });

      if ( !found && current ) {
        out.push({
          label: current,
          value: current,
        });
      }

      return out;

      function updateFound(entry) {
        if ( entry === current || entry === `{ current }s` ) {
          found = true;
        }
      }
    },

    filtered() {
      if ( !this.search ) {
        return this.lines;
      }

      const re = new RegExp(escapeRegex(this.search), 'img');
      const out = [];

      for ( const line of this.lines ) {
        let msg = line.rawMsg;
        const matches = msg.match(re);

        if ( !matches ) {
          continue;
        }

        const parts = msg.split(re);

        msg = '';
        while ( parts.length || matches.length ) {
          if ( parts.length ) {
            msg += ansiup.ansi_to_html(parts.shift()); // This also escapes
          }

          if ( matches.length ) {
            msg += `<span class="highlight">${ ansiup.ansi_to_html(matches.shift()) }</span>`;
          }
        }

        out.push({
          id:   line.id,
          time: line.time,
          msg,
        });
      }

      return out;
    },
  },

  beforeDestroy() {
    this.$refs.body.removeEventListener('scroll', this.boundUpdateFollowing);
    this.socket.disconnect();
    clearInterval(this.timerFlush);
  },

  async mounted() {
    await this.connect();
    this.boundUpdateFollowing = this.updateFollowing.bind(this);
    this.$refs.body.addEventListener('scroll', this.boundUpdateFollowing);
    this.boundFlush = this.flush.bind(this);
    this.timerFlush = setInterval(this.boundFlush, 100);
  },

  methods: {
    async connect() {
      if ( this.socket ) {
        await this.socket.disconnect();
        this.socket = null;
        this.lines = [];
      }

      const params = {
        container:  this.container,
        previous:   this.previous,
        follow:     true,
        timestamps: true,
        pretty:     true,
      };

      const range = `${ this.range }`.trim().toLowerCase();
      const match = range.match(/^(\d+)?\s*(.*?)s?$/);

      if ( match ) {
        const count = parseInt(match[1], 10) || 1;
        const unit = match[2];

        switch ( unit ) {
        case 'all':
          params.tailLines = -1;
          break;
        case 'line':
          params.tailLines = count;
          break;
        case 'second':
          params.sinceSeconds = count;
          break;
        case 'minute':
          params.sinceSeconds = count * 60;
          break;
        case 'hour':
          params.sinceSeconds = count * 60 * 60;
          break;
        case 'day':
          params.sinceSeconds = count * 60 * 60 * 24;
          break;
        }
      } else {
        params.tailLines = 100;
      }

      const url = addParams(`${ this.pod.links.view.replace(/^http/, 'ws') }/log`, params);

      this.socket = new Socket(url, false, 0, 'base64.binary.k8s.io');
      this.socket.addEventListener(EVENT_CONNECTED, (e) => {
        this.isOpen = true;
      });

      this.socket.addEventListener(EVENT_DISCONNECTED, (e) => {
        this.isOpen = false;
      });

      this.socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        this.isOpen = false;
        console.error('Connect Error', e); // eslint-disable-line no-console
      });

      this.socket.addEventListener(EVENT_MESSAGE, (e) => {
        const line = base64Decode(e.detail.data);

        let msg = line;
        let time = null;

        const idx = line.indexOf(' ');

        if ( idx > 0 ) {
          const timeStr = line.substr(0, idx);
          const date = new Date(timeStr);

          if ( !isNaN(date.getSeconds()) ) {
            time = date.toISOString();
            msg = line.substr(idx + 1);
          }
        }

        this.backlog.push({
          id:     lastId++,
          msg:    ansiup.ansi_to_html(msg),
          rawMsg: msg,
          time,
        });
      });

      this.socket.connect();
    },

    flush() {
      if ( this.backlog.length ) {
        this.lines.push(...this.backlog);
        this.backlog = [];
      }

      if ( this.isFollowing ) {
        this.$nextTick(() => {
          this.follow();
        });
      }
    },

    updateFollowing() {
      const el = this.$refs.body;

      this.isFollowing = el.scrollTop + el.clientHeight + 20 >= el.scrollHeight;
    },

    parseRange(range) {
      range = `${ range }`.toLowerCase();
      const match = range.match(/^(\d+)?\s*(.*)s?$/);
      const out = {};

      if ( match ) {
        const count = parseInt(match[1], 10) || 1;
        const unit = match[2];

        switch ( unit ) {
        case 'all':
          out.tailLines = -1;
          break;
        case 'line':
          out.tailLines = count;
          break;
        case 'second':
          out.sinceSeconds = count;
          break;
        case 'minute':
          out.sinceSeconds = count * 60;
          break;
        case 'hour':
          out.sinceSeconds = count * 60 * 60;
          break;
        case 'day':
          out.sinceSeconds = count * 60 * 60 * 24;
          break;
        }
      } else {
        out.tailLines = 100;
      }

      return out;
    },

    clear() {
      this.lines = [];
    },

    async download(btnCb) {
      const url = addParams(`${ this.pod.links.view }/log`, {
        container:  this.container,
        previous:   this.previous,
        pretty:     true,
        limitBytes: 750 * 1024 * 1024 * 1024,
      });

      try {
        const res = await this.$store.dispatch('cluster/request', { url, responseType: 'blob' });
        // const blob = new Blob([res], { type: 'text/plain;charset=utf-8' });
        const fileName = `${ this.pod.nameDisplay }_${ this.container }.log`;

        saveAs(res.data, fileName);
        btnCb(true);
      } catch (e) {
        btnCb(false);
      }
    },

    follow() {
      const el = this.$refs.body;

      el.scrollTop = el.scrollHeight;
    },

    switchTo(container) {
      this.container = container;
      this.connect();
    },

    toggleWrap(on) {
      this.wrap = on;
      this.$store.dispatch('prefs/set', { key: LOGS_WRAP, value: this.wrap });
    },

    togglePrevious(on) {
      this.previous = on;
      this.connect();
    },

    toggleTimestamps(on) {
      this.timestamps = on;
      this.$store.dispatch('prefs/set', { key: LOGS_TIME, value: this.timestamps });
    },

    toggleRange(range) {
      this.range = range;
      this.$store.dispatch('prefs/set', { key: LOGS_RANGE, value: this.range });
      this.connect();
    },
  }
};
</script>

<template>
  <Window :active="active">
    <template #title>
      <v-select
        v-model="container"
        :disabled="containerChoices.length <= 1"
        class="auto-width inline mini"
        :options="containerChoices"
        :searchable="false"
        :clearable="false"
        @input="switchTo($event)"
      >
        <template #selected-option="option">
          <t v-if="option" k="wm.containerLogs.containerName" :label="option.label" />
        </template>
      </v-select>
      <button class="btn btn-sm bg-primary" :disabled="isFollowing" @click="follow">
        <t k="wm.containerLogs.follow" />
      </button>
      <button class="btn btn-sm bg-primary" @click="clear">
        <t k="wm.containerLogs.clear" />
      </button>
      <AsyncButton class="btn-sm" mode="download" @click="download" />

      <div class="pull-right ml-5">
        <t :class="{'text-error': !isOpen}" :k="isOpen ? 'wm.connection.connected' : 'wm.connection.disconnected'" />
      </div>
      <div class="pull-right ml-5">
        <input v-model="search" class="input-sm p-5" type="search" :placeholder="t('wm.containerLogs.search')" />
      </div>
      <div class="pull-right ml-5">
        <v-popover
          trigger="click"
          placement="top"
        >
          <button class="btn btn-sm bg-primary">
            <i class="icon icon-gear" />
          </button>

          <template slot="popover">
            <LabeledSelect
              v-model="range"
              :label="t('wm.containerLogs.range.label')"
              :options="rangeOptions"
              :searchable="false"
              :clearable="false"
              @input="toggleRange($event)"
            />
            <div><Checkbox :label="t('wm.containerLogs.previous')" :value="previous" @input="togglePrevious" /></div>
            <div><Checkbox :label="t('wm.containerLogs.wrap')" :value="wrap" @input="toggleWrap " /></div>
            <div><Checkbox :label="t('wm.containerLogs.timestamps')" :value="timestamps" @input="toggleTimestamps" /></div>
          </template>
        </v-popover>
      </div>
    </template>
    <template #body>
      <div ref="body" class="logs-container" :class="{'open': isOpen, 'closed': !isOpen}">
        <div
          class="logs-body"
          :class="{'show-times': timestamps && filtered.length, 'wrap-lines': wrap}"
        >
          <template v-if="filtered.length">
            <template
              v-for="line in filtered"
            >
              <DateFormatter v-if="timestamps" :key="line.id + '-date'" tag-name="div" class="time" :value="line.time" />
              <div :key="line.id + '-msg'" class="msg" v-html="line.msg" />
            </template>
          </template>
          <t v-else-if="search" k="wm.containerLogs.noMatch" class="msg text-muted" />
          <t v-else k="wm.containerLogs.noData" class="msg text-muted" />
        </div>
      </div>
    </template>
  </Window>
</template>

<style lang="scss">
  @import '@/node_modules/xterm/css/xterm.css';

  .logs-container {
    height: 100%;
    overflow: auto;
    padding: 5px;
    background-color: var(--logs-bg);
    font-family: Menlo,Consolas,monospace;
    color: var(--logs-text);
  }

  .logs-body {
    display: grid;
    grid-template-areas: "msg";
    grid-template-columns: auto;
    column-gap: 10px;

    .closed {
      opacity: 0.25;
    }

    &.show-times {
      grid-template-areas: "time msg";
      grid-template-columns: min-content auto;
    }

    .time {
      white-space: nowrap;
    }

    .msg {
      white-space: nowrap;

      .highlight {
        color: var(--logs-highlight);
        background-color: var(--logs-highlight-bg);
      }
    }

    &.wrap-lines .msg {
      white-space: normal;
    }
  }
</style>

<!--
    download() {
      const blob = new Blob(this.backlog, { type: 'text/plain;charset=utf-8' });
      const fileName = `${ this.$store.state.shell.container.name }.log`;

      saveAs(blob, fileName);
    }
  }
};
</script>
-->
