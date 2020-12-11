<script>
import { saveAs } from 'file-saver';
import AnsiUp from 'ansi_up';
import { addParams } from '@/utils/url';
import { base64Decode } from '@/utils/crypto';
import {
  LOGS_RANGE, LOGS_TIME, LOGS_WRAP, DATE_FORMAT, TIME_FORMAT
} from '@/store/prefs';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';
import AsyncButton from '@/components/AsyncButton';
import Select from '@/components/form/Select';
import day from 'dayjs';

import { escapeHtml, escapeRegex } from '@/utils/string';

import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@/utils/socket';
import Window from './Window';

let lastId = 1;
const ansiup = new AnsiUp();

export default {
  components: {
    Window, Select, LabeledSelect, Checkbox, AsyncButton
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

    url: {
      type:    String,
      default: null,
    },

    // The container in the pod to initially show
    initialContainer: {
      type:    String,
      default: null,
    }
  },

  data() {
    return {
      container:   this.initialContainer || this.pod?.defaultContainerName,
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
      now:         new Date(),
    };
  },

  computed: {
    containerChoices() {
      return this.pod?.spec?.containers?.map(x => x.name) || [];
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
        updateFound(value);
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
        entry = entry.replace(/[, ]/g, '').replace(/s$/, '');
        const normalized = current.replace(/[, ]/g, '').replace(/s$/, '');

        if ( entry === normalized) {
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

    timeFormatStr() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return `${ dateFormat } ${ timeFormat }`;
    }
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
        previous:   this.previous,
        follow:     true,
        timestamps: true,
        pretty:     true,
      };

      if ( this.container ) {
        params.container = this.container;
      }

      const range = `${ this.range }`.trim().toLowerCase();
      const match = range.match(/^(\d+)?\s*(.*?)s?$/);

      if ( match ) {
        const count = parseInt(match[1], 10) || 1;
        const unit = match[2];

        switch ( unit ) {
        case 'all':
          // Do nothing
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

      let url = this.url || `${ this.pod.links.view }/log`;

      url = addParams(url.replace(/^http/, 'ws'), params);

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

      this.isFollowing = el.scrollTop + el.clientHeight + 2 >= el.scrollHeight;
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
      let url = this.url || `${ this.pod.links.view }/log`;

      if ( this.container ) {
        url = addParams(url, { container: this.container });
      }

      url = addParams(url, {
        previous:   this.previous,
        pretty:     true,
        limitBytes: 750 * 1024 * 1024,
      });

      try {
        const inStore = this.$store.getters['currentProduct'].inStore;
        const res = await this.$store.dispatch(`${ inStore }/request`, { url, responseType: 'blob' });
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
      // Intentionally not saved as a pref
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

    format(time) {
      if ( !time ) {
        return '';
      }

      return day(time).format(this.timeFormatStr);
    },
  },
};
</script>

<template>
  <Window :active="active">
    <template #title>
      <Select
        v-if="containerChoices.length > 0"
        v-model="container"
        :disabled="containerChoices.length === 1"
        class="containerPicker pull-left"
        :options="containerChoices"
        :clearable="false"
        placement="top"
        @input="switchTo($event)"
      >
        <template #selected-option="option">
          <t v-if="option" k="wm.containerLogs.containerName" :label="option.label" />
        </template>
      </Select>
      <div class="pull-left ml-5">
        <button class="btn btn-sm bg-primary" :disabled="isFollowing" @click="follow">
          <t k="wm.containerLogs.follow" />
        </button>
        <button class="btn btn-sm bg-primary" @click="clear">
          <t k="wm.containerLogs.clear" />
        </button>
        <AsyncButton class="btn-sm" mode="download" @click="download" />
      </div>

      <div class="pull-right text-center p-10" style="min-width: 80px;">
        <t :class="{'text-success': isOpen, 'text-error': !isOpen}" :k="isOpen ? 'wm.connection.connected' : 'wm.connection.disconnected'" />
      </div>
      <div class="pull-right ml-5">
        <input v-model="search" class="input-sm" type="search" :placeholder="t('wm.containerLogs.search')" />
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
              class="range"
              :label="t('wm.containerLogs.range.label')"
              :options="rangeOptions"
              :clearable="false"
              placement="top"
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
      <div
        ref="body"
        :class="{'logs-container': true, 'open': isOpen, 'closed': !isOpen, 'show-times': timestamps && filtered.length, 'wrap-lines': wrap}"
      >
        <table class="fixed" cellpadding="0" cellspacing="0">
          <tbody class="logs-body">
            <template v-if="filtered.length">
              <tr v-for="line in filtered" :key="line.id">
                <td :key="line.id + '-time'" class="time" v-html="format(line.time)" />
                <td :key="line.id + '-msg'" class="msg" v-html="line.msg" />
              </tr>
            </template>
            <tr v-else-if="search">
              <td v-t="'wm.containerLogs.noMatch'" colspan="2" class="msg text-muted" />
            </tr>
            <tr v-else v-t="'wm.containerLogs.noData'" colspan="2" class="msg text-muted" />
          </tbody>
        </table>
      </div>
    </template>
  </Window>
</template>

<style lang="scss" scoped>
  .logs-container {
    height: 100%;
    overflow: auto;
    padding: 5px;
    background-color: var(--logs-bg);
    font-family: Menlo,Consolas,monospace;
    color: var(--logs-text);

    .closed {
      opacity: 0.25;
    }

    .time {
      white-space: nowrap;
      display: none;
      width: 0;
      padding-right: 15px;
      user-select: none;
    }

    &.show-times .time {
      display: initial;
      width: auto;
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

  .containerPicker {
    ::v-deep &.unlabeled-select {
      display: inline-block;
      min-width: 200px;
    }
  }

</style>
