<script>
import { saveAs } from 'file-saver';
import AnsiUp from 'ansi_up';
import { addParams } from '@shell/utils/url';
import { base64DecodeToBuffer } from '@shell/utils/crypto';
import { LOGS_RANGE, LOGS_TIME, LOGS_WRAP } from '@shell/store/prefs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import AsyncButton from '@shell/components/AsyncButton';
import Select from '@shell/components/form/Select';
import VirtualList from 'vue3-virtual-scroll-list';
import LogItem from '@shell/components/LogItem';
import { shallowRef } from 'vue';
import { debounce } from 'lodash';

import { escapeRegex } from '@shell/utils/string';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/features';

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
// Convert arrayBuffer(Uint8Array) to string
// ref: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
// ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/of
const ab2str = (input, outputEncoding = 'utf8') => {
  const decoder = new TextDecoder(outputEncoding);

  return decoder.decode(input);
};

// The utf-8 encoded messages pushed by websocket may truncate multi-byte utf-8 characters,
// which causes the front-end to be unable to parse the truncated multi-byte utf-8 characters in the previous and next messages when decoding.
// Therefore, we need to determine whether the last 4 bytes of the current pushed message contain incomplete utf-8 encoded characters.
// ref: https://en.wikipedia.org/wiki/UTF-8#Encoding
const isLogTruncated = (uint8ArrayBuffer) => {
  const len = uint8ArrayBuffer.length;
  const count = Math.min(4, len);
  let isTruncated = false;

  // Parses the last ${count} bytes of the array to determine if there are any truncated utf-8 characters.
  for ( let i = 0; i < count; i++ ) {
    const a = uint8ArrayBuffer[len - (1 + i)];

    // 1 byte utf-8 character in binary form: 0xxxxxxxxx
    if ((a & 0b10000000) === 0b00000000) {
      break;
    }
    // Multi-byte utf-8 character, intermediate binary form: 10xxxxxx
    if ((a & 0b11000000) === 0b10000000) {
      continue;
    }
    // 2 byte utf-8 character in binary form: 110xxxxx 10xxxxxx
    if ((a & 0b11100000) === 0b11000000) {
      if ( i !== 1) {
        isTruncated = true;
      }
      break;
    }
    // 3 byte utf-8 character in binary form: 1110xxxx 10xxxxxx 10xxxxxx
    if ((a & 0b11110000) === 0b11100000) {
      if (i !== 2) {
        isTruncated = true;
      }
      break;
    }
    // 4 byte utf-8 character in binary form: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    if ((a & 0b11111000) === 0b11110000) {
      if (i !== 3) {
        isTruncated = true;
      }
      break;
    }
  }

  return isTruncated;
};

export default {
  components: {
    Window,
    Select,
    LabeledSelect,
    Checkbox,
    AsyncButton,
    VirtualList,
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
      container:           this.initialContainer || this.pod?.defaultContainerName,
      socket:              null,
      isOpen:              false,
      isFollowing:         true,
      scrollThreshold:     80,
      timestamps:          this.$store.getters['prefs/get'](LOGS_TIME),
      wrap:                this.$store.getters['prefs/get'](LOGS_WRAP),
      previous:            false,
      search:              '',
      backlog:             [],
      lines:               [],
      now:                 new Date(),
      logItem:             shallowRef(LogItem),
      isContainerMenuOpen: false
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

      const containers = (this.pod?.spec?.containers || []).map((x) => x.name);
      const initContainers = (this.pod?.spec?.initContainers || []).map((x) => x.name);

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
    }
  },

  watch: {
    container() {
      this.connect();
    },

    lines: {
      handler() {
        if (this.isFollowing) {
          this.$nextTick(() => {
            this.follow();
          });
        }
      },
      deep: true
    }

  },

  beforeUnmount() {
    this.cleanup();
  },

  async mounted() {
    await this.connect();
    this.boundFlush = this.flush.bind(this);
    this.timerFlush = setInterval(this.boundFlush, 200);
  },

  methods: {
    openContainerMenu() {
      this.isContainerMenuOpen = true;
    },

    closeContainerMenu() {
      this.isContainerMenuOpen = false;
    },

    async connect() {
      if ( this.socket ) {
        await this.socket.disconnect();
        this.socket = null;
        this.lines = [];
      }

      let params = {
        previous:   this.previous,
        follow:     true,
        timestamps: true,
        pretty:     true,
      };

      if ( this.container ) {
        params.container = this.container;
      }

      const rangeParams = this.parseRange(this.range);

      params = { ...params, ...rangeParams };

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

      let logBuffer = [];
      let truncatedLog = '';

      this.socket.addEventListener(EVENT_MESSAGE, (e) => {
        const decodedData = e.detail?.data || '';
        const replacedData = decodedData.replace(/[-_]/g, (char) => char === '-' ? '+' : '/');
        const b = base64DecodeToBuffer(replacedData);
        const isTruncated = isLogTruncated(b);

        if (isTruncated === true) {
          logBuffer.push(...b);

          return;
        }

        let d;

        // If the logBuffer is not empty,
        // there are truncated utf-8 characters in the previous message
        // that need to be merged with the current message before decoding.
        if (logBuffer.length > 0) {
          // Convert arrayBuffer(Uint8Array) to string
          // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/of
          d = ab2str(Uint8Array.of(...logBuffer, ...b));
          logBuffer = [];
        } else {
          d = b.toString();
        }
        let data = d;

        if (truncatedLog) {
          data = `${ truncatedLog }${ d }`;
          truncatedLog = '';
        }

        if (!d.endsWith('\n')) {
          const lines = data.split(/\n/);

          if (lines.length === 1) {
            truncatedLog = data;

            return;
          }
          data = lines.slice(0, -1).join('\n');
          truncatedLog = lines.slice(-1);
        }
        // Websocket message may contain multiple lines - loop through each line, one by one
        data.split('\n').filter((line) => line).forEach((line) => {
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

          const parsedLine = {
            id:     lastId++,
            msg:    ansiup.ansi_to_html(msg),
            rawMsg: msg,
            time,
          };

          Object.freeze(parsedLine);

          this.backlog.push(parsedLine);
        });
      });

      this.socket.connect();
    },

    flush() {
      if ( this.backlog.length ) {
        this.lines.push(...this.backlog);
        this.backlog = [];
        const maxLines = this.parseRange(this.range)?.tailLines;

        if (maxLines && this.lines.length > maxLines) {
          this.lines = this.lines.slice(-maxLines);
        }
      }
    },

    updateFollowing: debounce(function() {
      const virtualList = this.$refs.virtualList;

      if (virtualList) {
        const scrollSize = virtualList.getScrollSize();
        const clientSize = virtualList.getClientSize();
        const offset = virtualList.getOffset();

        const distanceFromBottom = scrollSize - clientSize - offset;

        this.isFollowing = distanceFromBottom <= this.scrollThreshold;
      }
    }, 100),

    parseRange(range) {
      range = `${ range }`.trim().toLowerCase();
      const match = range.match(/^(\d+)?\s*(.*?)s?$/);

      const out = {};

      if ( match ) {
        const count = parseInt(match[1], 10) || 1;
        const unit = match[2];

        switch ( unit ) {
        case 'all':
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
      const virtualList = this.$refs.virtualList;

      if (virtualList) {
        virtualList.scrollToBottom();
        this.isFollowing = true;
      }
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
          v-model:value="container"
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
        <div class="log-action log-action-group ml-5">
          <button
            class="btn role-primary wm-btn"
            role="button"
            :aria-label="t('wm.containerLogs.follow')"
            :aria-disabled="isFollowing"
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
            class="btn role-primary wm-btn"
            role="button"
            :aria-label="t('wm.containerLogs.clear')"
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
            role="button"
            :aria-label="t('asyncButton.download.action')"
            @click="download"
          />
        </div>

        <div class="wm-seperator" />

        <div class="log-action log-previous ml-5">
          <div>
            <Checkbox
              :label="t('wm.containerLogs.previous')"
              :value="previous"
              @update:value="togglePrevious"
            />
          </div>
        </div>

        <div class="log-action log-action-group ml-5">
          <div
            role="menu"
            tabindex="0"
            :aria-label="t('wm.containerLogs.logActionMenu')"
            @click="openContainerMenu"
            @blur.capture="closeContainerMenu"
            @keyup.enter="openContainerMenu"
            @keyup.space="openContainerMenu"
          >
            <v-dropdown
              :triggers="[]"
              :shown="isContainerMenuOpen"
              placement="top"
              popperClass="containerLogsDropdown"
              :autoHide="false"
              :flip="false"
              :container="false"
              @focus.capture="openContainerMenu"
            >
              <button
                class="btn role-primary btn-cog"
                role="button"
                :aria-label="t('wm.containerLogs.options')"
              >
                <i
                  class="icon icon-gear"
                  :alt="t('wm.containerLogs.options')"
                />
                <i
                  class="icon icon-chevron-up"
                  :alt="t('wm.containerLogs.expand')"
                />
              </button>

              <template #popper>
                <div class="filter-popup">
                  <LabeledSelect
                    v-model:value="range"
                    class="range"
                    :label="t('wm.containerLogs.range.label')"
                    :options="rangeOptions"
                    :clearable="false"
                    placement="top"
                    role="menuitem"
                    @update:value="toggleRange($event)"
                  />
                  <div>
                    <Checkbox
                      :label="t('wm.containerLogs.wrap')"
                      :value="wrap"
                      role="menuitem"
                      @update:value="toggleWrap"
                    />
                  </div>
                  <div>
                    <Checkbox
                      :label="t('wm.containerLogs.timestamps')"
                      :value="timestamps"
                      role="menuitem"
                      @update:value="toggleTimestamps"
                    />
                  </div>
                </div>
              </template>
            </v-dropdown>
          </div>
        </div>

        <div class="log-action log-action-group ml-5">
          <input
            v-model="search"
            class="input-sm"
            type="search"
            role="textbox"
            :aria-label="t('wm.containerLogs.searchLogs')"
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
        <VirtualList
          v-show="filtered.length"
          ref="virtualList"
          class="virtual-list"
          data-key="id"
          :data-sources="filtered"
          :data-component="logItem"
          direction="vertical"
          :keeps="200"
          @scroll="updateFollowing"
        />
        <template v-if="!filtered.length">
          <div v-if="search">
            <span class="msg text-muted">{{ t('wm.containerLogs.noMatch') }}</span>
          </div>
          <div v-else>
            <span class="msg text-muted">{{ t('wm.containerLogs.noData') }}</span>
          </div>
        </template>
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

  .logs-container{
    height: 100%;
    overflow: auto;
    padding: 5px;
    background-color: var(--logs-bg);
    font-family: Menlo,Consolas,monospace;
    color: var(--logs-text);

    .closed {
      opacity: 0.25;
    }

    &.wrap-lines :deep() .msg {
      white-space: pre-wrap;
    }

    &.show-times :deep() .time {
      display: initial;
      width: auto;
    }

  }

  .containerPicker {
    :deep() &.unlabeled-select {
      display: inline-block;
      min-width: 200px;
      height: 30px;
      min-height: 30px;
      width: initial;
    }
  }

  .log-action {
    button {
      border: 0 !important;
      min-height: 30px;
      line-height: 30px;
      margin: 0 2px;
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

  .log-action-group {
    display: flex;
    gap: 3px;

    .input-sm {
      min-width: 180px;
    }
  }

  .log-previous {
    align-items: center;
    display: flex;
    min-width: 175px;
    height: 30px;
    text-overflow : ellipsis;
    overflow      : hidden;
    white-space   : nowrap;
    padding-left: 4px;
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

  .virtual-list {
    overflow-y: auto;
    height:100%;
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
