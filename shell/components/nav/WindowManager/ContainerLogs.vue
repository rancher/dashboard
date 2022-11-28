<script>
import { saveAs } from 'file-saver';
import AnsiUp from 'ansi_up';
import { addParams } from '@shell/utils/url';
import { base64Decode } from '@shell/utils/crypto';
import {
  LOGS_RANGE, LOGS_TIME, LOGS_WRAP, DATE_FORMAT, TIME_FORMAT
} from '@shell/store/prefs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import AsyncButton from '@shell/components/AsyncButton';
import Select from '@shell/components/form/Select';
import day from 'dayjs';

import { escapeHtml, escapeRegex } from '@shell/utils/string';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/product/harvester-manager';

import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@shell/utils/socket';
import Window from './Window';

let lastId = 1;
const ansiup = new AnsiUp();

export default {
  components: {
    Window, Select, LabeledSelect, Checkbox, AsyncButton
  },

  props: {
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
      previous:    false,
      search:      '',
      backlog:     [],
      lines:       [],
      now:         new Date(),
    };
  },

  fetch() {
    // See https://github.com/rancher/dashboard/issues/6122. At some point prior to 2.6.5 LOGS_RANGE has become polluted with something
    // invalid. To avoid everyone having to manually remove invalid user preferences fix it automatically here
    const originalRange = this.$store.getters['prefs/get'](LOGS_RANGE);

    this.range = originalRange.value || originalRange;

    if (originalRange !== this.range) { // Rancher was broken, so persist the fix
      this.$store.dispatch('prefs/set', { key: LOGS_RANGE, value: this.range });
    }
  },

  computed: {
    containerChoices() {
      const isHarvester = this.$store.getters['currentProduct'].inStore === VIRTUAL;

      const containers = (this.pod?.spec?.containers || []).map(x => x.name);
      const initContainers = (this.pod?.spec?.initContainers || []).map(x => x.name);

      return isHarvester ? [] : [...containers, ...initContainers];
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
      updateFound('all');

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

  watch: {
    container() {
      this.connect();
    },
  },

  beforeDestroy() {
    this.$refs.body.removeEventListener('scroll', this.boundUpdateFollowing);
    this.cleanup();
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
        const inStore = this.$store.getters['currentStore']();
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

    cleanup() {
      if ( this.socket ) {
        this.socket.disconnect();
        this.socket = null;
      }

      clearInterval(this.timerFlush);
    },
  },
};
</script>

<template>
  <Window
    :active="active"
    :before-close="cleanup"
  >
    <template #title>
      <div class="wm-button-bar">
        <Select
          v-if="containerChoices.length > 0"
          v-model="container"
          :disabled="containerChoices.length === 1"
          class="containerPicker"
          :options="containerChoices"
          :clearable="false"
          placement="top"
        >
          <template #selected-option="option">
            <t
              v-if="option"
              k="wm.containerLogs.containerName"
              :label="option.label"
            />
          </template>
        </Select>
        <div class="log-action ml-5">
          <button
            class="btn bg-primary wm-btn"
            :disabled="isFollowing"
            @click="follow"
          >
            <t
              class="wm-btn-large"
              k="wm.containerLogs.follow"
            />
            <i class="wm-btn-small icon icon-chevron-end" />
          </button>
          <button
            class="btn bg-primary wm-btn"
            @click="clear"
          >
            <t
              class="wm-btn-large"
              k="wm.containerLogs.clear"
            />
            <i class="wm-btn-small icon icon-close" />
          </button>
          <AsyncButton
            mode="download"
            @click="download"
          />
        </div>

        <div class="wm-seperator" />

        <div class="log-action log-previous ml-5">
          <div>
            <Checkbox
              :label="t('wm.containerLogs.previous')"
              :value="previous"
              @input="togglePrevious"
            />
          </div>
        </div>

        <div class="log-action ml-5">
          <v-popover
            trigger="click"
            placement="top"
          >
            <button class="btn bg-primary btn-cog">
              <i class="icon icon-gear" />
              <i class="icon icon-chevron-up" />
            </button>

            <template slot="popover">
              <div class="filter-popup">
                <LabeledSelect
                  v-model="range"
                  class="range"
                  :label="t('wm.containerLogs.range.label')"
                  :options="rangeOptions"
                  :clearable="false"
                  placement="top"
                  @input="toggleRange($event)"
                />
                <div>
                  <Checkbox
                    :label="t('wm.containerLogs.wrap')"
                    :value="wrap"
                    @input="toggleWrap "
                  />
                </div>
                <div>
                  <Checkbox
                    :label="t('wm.containerLogs.timestamps')"
                    :value="timestamps"
                    @input="toggleTimestamps"
                  />
                </div>
              </div>
            </template>
          </v-popover>
        </div>

        <div class="log-action ml-5">
          <input
            v-model="search"
            class="input-sm"
            type="search"
            :placeholder="t('wm.containerLogs.search')"
          >
        </div>

        <div class="status log-action p-10">
          <t
            :class="{'text-success': isOpen, 'text-error': !isOpen}"
            :k="isOpen ? 'wm.connection.connected' : 'wm.connection.disconnected'"
          />
        </div>
      </div>
    </template>
    <template #body>
      <div
        ref="body"
        :class="{'logs-container': true, 'open': isOpen, 'closed': !isOpen, 'show-times': timestamps && filtered.length, 'wrap-lines': wrap}"
      >
        <table
          class="fixed"
          cellpadding="0"
          cellspacing="0"
        >
          <tbody class="logs-body">
            <template v-if="filtered.length">
              <tr
                v-for="line in filtered"
                :key="line.id"
              >
                <td
                  :key="line.id + '-time'"
                  class="time"
                  v-html="format(line.time)"
                />
                <td
                  :key="line.id + '-msg'"
                  class="msg"
                  v-html="line.msg"
                />
              </tr>
            </template>
            <tr v-else-if="search">
              <td
                v-t="'wm.containerLogs.noMatch'"
                colspan="2"
                class="msg text-muted"
              />
            </tr>
            <tr
              v-else
              v-t="'wm.containerLogs.noData'"
              colspan="2"
              class="msg text-muted"
            />
          </tbody>
        </table>
      </div>
    </template>
  </Window>
</template>

<style lang="scss" scoped>
  .wm-button-bar {
    display: flex;

    .wm-seperator {
      flex: 1;
    }

    .wm-btn-small {
      display: none;
      margin: 0;
    }
  }

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
      white-space: pre;

      .highlight {
        color: var(--logs-highlight);
        background-color: var(--logs-highlight-bg);
      }
    }

    &.wrap-lines .msg {
      white-space: pre-wrap;
    }
  }

  .containerPicker {
    ::v-deep &.unlabeled-select {
      display: inline-block;
      min-width: 200px;
      height: 30px;
      width: initial;
    }
  }

  .log-action {
    button {
      border: 0 !important;
      min-height: 30px;
      line-height: 30px;
    }

    > input {
      height: 30px;
    }

    .btn-cog {
      padding: 0 5px;
      > i {
        margin: 0;
      }
    }
  }

  .log-previous {
    align-items: center;
    display: flex;
    height: 30px;
  }

  .status {
    align-items: center;
    display: flex;
    justify-content: flex-end;
    min-width: 105px;
    height: 30px;
  }

  .filter-popup {
    > * {
      margin-bottom: 10px;
    }
  }

  @media only screen and (max-width: 1060px) {
    .wm-button-bar {
      .wm-btn {
        padding: 0 10px;

        .wm-btn-large {
          display: none;
        }

        .wm-btn-small {
          display: inline;
          margin: 0;
        }
      }
    }
  }
</style>
