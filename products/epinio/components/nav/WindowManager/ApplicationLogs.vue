<script>
// Streaming logs over socket isn't supported at the moment (requires auth changes to backend or un-CORS-ing)
// https://github.com/epinio/ui/issues/3
// ApplicationLogs & StagingLogs come from components/nav/WindowManager/ContainerLogs.vue
// Both are WIP, specifically the amount of common code. This should be moved to a mixin.
/* eslint-disable no-unused-vars */
import AnsiUp from 'ansi_up';
import { addParams } from '@/utils/url';
import { base64Decode } from '@/utils/crypto';
import { LOGS_TIME, LOGS_WRAP, DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import Checkbox from '@/components/form/Checkbox';
import AsyncButton from '@/components/AsyncButton';
import day from 'dayjs';

import { escapeHtml, escapeRegex } from '@/utils/string';

import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@/utils/socket';
import Window from '@/components/nav/WindowManager/Window';
import { EPINIO_MGMT_STORE, EPINIO_TYPES } from '@/products/epinio/types';

const lastId = 1;
const ansiup = new AnsiUp();

export default {
  components: {
    Window,
    Checkbox,
    AsyncButton
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

    // The application to connect to
    application: {
      type:     Object,
      required: true,
    },

  },

  data() {
    return {
      socket:      null,
      isOpen:      false,
      isFollowing: true,
      timestamps:  this.$store.getters['prefs/get'](LOGS_TIME),
      wrap:        this.$store.getters['prefs/get'](LOGS_WRAP),
      search:      '',
      backlog:     [],
      lines:       [],
    };
  },

  computed: {

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
    getSocketUrl() {
      const currentClusterId = this.$store.getters['clusterId'];
      const currentCluster = this.$store.getters[`${ EPINIO_MGMT_STORE }/byId`](EPINIO_TYPES.INSTANCE, currentClusterId);
      const api = currentCluster.api;
      const endpoint = this.application.linkFor('logs');
      const url = addParams(`${ api }${ endpoint }`, { follow: true });

      return url.replace(/^http/, 'ws');
      // return url;
    },

    async connect() {
      if ( this.socket ) {
        await this.socket.disconnect();
        this.socket = null;
        this.lines = [];
      }

      this.lines = [{
        id:     '1',
        time:   '',
        rawMsg: 'HELLOW WORLD',
        msg:    'Application Logs ...'
      }];

      // https://github.com/epinio/epinio/blob/6ef5cc0044f71c01cf90ed83bcdda18251c594a7/internal/cli/usercmd/client.go

      // const url = this.getSocketUrl();

      // console.warn('!!!!!!!!!!!: ', url);

      // this.socket = new Socket(url, false, 0, 'base64.binary.k8s.io');
      // this.socket.addEventListener(EVENT_CONNECTED, (e) => {
      //   this.isOpen = true;
      // });

      // this.socket.addEventListener(EVENT_DISCONNECTED, (e) => {
      //   this.isOpen = false;
      // });

      // this.socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
      //   this.isOpen = false;
      //   console.error('Connect Error', e); // eslint-disable-line no-console
      // });

      // this.socket.addEventListener(EVENT_MESSAGE, (e) => {
      //   const line = base64Decode(e.detail.data);

      //   let msg = line;
      //   let time = null;

      //   const idx = line.indexOf(' ');

      //   if ( idx > 0 ) {
      //     const timeStr = line.substr(0, idx);
      //     const date = new Date(timeStr);

      //     if ( !isNaN(date.getSeconds()) ) {
      //       time = date.toISOString();
      //       msg = line.substr(idx + 1);
      //     }
      //   }

      //   this.backlog.push({
      //     id:     lastId++,
      //     msg:    ansiup.ansi_to_html(msg),
      //     rawMsg: msg,
      //     time,
      //   });
      // });

      // this.socket.connect();
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

    clear() {
      this.lines = [];
    },

    download(btnCb) {
      throw new Error('Not Implemented');
    },

    follow() {
      const el = this.$refs.body;

      el.scrollTop = el.scrollHeight;
    },

    toggleWrap(on) {
      this.wrap = on;
      this.$store.dispatch('prefs/set', { key: LOGS_WRAP, value: this.wrap });
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
  <Window :active="active" :before-close="cleanup">
    <template #title>
      <div class="log-action pull-left ml-5">
        <button class="btn bg-primary" :disabled="isFollowing" @click="follow">
          <t k="wm.containerLogs.follow" />
        </button>
        <button class="btn bg-primary" @click="clear">
          <t k="wm.containerLogs.clear" />
        </button>
        <AsyncButton mode="download" @click="download" />
      </div>

      <div class="status log-action pull-right text-center p-10" style="min-width: 80px;">
        <t :class="{'text-success': isOpen, 'text-error': !isOpen}" :k="isOpen ? 'wm.connection.connected' : 'wm.connection.disconnected'" />
      </div>
      <div class="log-action pull-right ml-5">
        <input v-model="search" class="input-sm" type="search" :placeholder="t('wm.containerLogs.search')" />
      </div>
      <div class="log-action pull-right ml-5">
        <v-popover
          trigger="click"
          placement="top"
        >
          <button class="btn bg-primary">
            <i class="icon icon-gear" />
          </button>

          <template slot="popover">
            <div class="filter-popup">
              <div><Checkbox :label="t('wm.containerLogs.wrap')" :value="wrap" @input="toggleWrap " /></div>
            </div>
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
  }

  .status {
    align-items: center;
    display: flex;
    min-width: 80px;
    height: 30px;
  }

  .filter-popup {
    > * {
      margin-bottom: 10px;
    }
  }
</style>
