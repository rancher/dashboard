<script>
import { allHash } from '@shell/utils/promise';
import { addParams } from '@shell/utils/url';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import Select from '@shell/components/form/Select';
import { NODE } from '@shell/config/types';
import { mapGetters } from 'vuex';
import Socket, {
  EVENT_CONNECTED,
  EVENT_CONNECTING,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR,
} from '@shell/utils/socket';
import Window from './Window';
import dayjs from 'dayjs';

const commands = {
  linux: [
    '/bin/sh',
    '-c',
    'TERM=xterm-256color; export TERM; [ -x /bin/bash ] && ([ -x /usr/bin/script ] && /usr/bin/script -q -c "/bin/bash" /dev/null || exec /bin/bash) || exec /bin/sh',
  ],
  windows: ['cmd']
};

export default {
  components: { Window, Select },

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
      type:    Number,
      default: undefined,
    },

    // The width of the window
    width: {
      type:    Number,
      default: undefined,
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
    },

    // Runs this command immediately after connecting
    commandOnFirstConnect: {
      type:    String,
      default: null
    }
  },

  data() {
    return {
      container:         this.initialContainer || this.pod?.defaultContainerName,
      socket:            null,
      terminal:          null,
      fitAddon:          null,
      searchAddon:       null,
      webglAddon:        null,
      canvasAddon:       null,
      isOpen:            false,
      isOpening:         false,
      backlog:           [],
      node:              null,
      keepAliveTimer:    null,
      errorMsg:          '',
      backupShells:      ['linux', 'windows'],
      os:                undefined,
      retries:           0,
      currFocusedElem:   undefined,
      xtermContainerRef: undefined
    };
  },

  computed: {
    xtermConfig() {
      return {
        allowProposedApi: true,
        cursorBlink:      true,
        useStyle:         true,
        fontSize:         12,
      };
    },

    containerChoices() {
      return this.pod?.spec?.containers?.map((x) => x.name) || [];
    },

    ...mapGetters({ t: 'i18n/t' }),

    isXtermFocused() {
      return this.currFocusedElem === this.terminal?.textarea;
    },

    isXtermContainerFocused() {
      return this.currFocusedElem === this.xtermContainerRef;
    },

    xTermContainerTabIndex() {
      return this.isXtermFocused ? 0 : -1;
    }
  },

  watch: {
    container() {
      this.connect();
    },

    height() {
      this.fit();
    },

    width() {
      this.fit();
    },

    isXtermContainerFocused: {
      handler(neu) {
        const shellEl = this.terminal?.textarea;

        if (shellEl) {
          shellEl.tabIndex = neu ? -1 : 0;
        }
      },
      immediate: true
    }
  },

  beforeUnmount() {
    document.removeEventListener('keyup', this.handleKeyPress);
    this.$refs?.containerShell?.$el?.removeEventListener('focusin', this.focusInHandler);
    this.$refs?.xterm.removeEventListener('focusout', this.focusOutHandler);

    clearInterval(this.keepAliveTimer);
    this.cleanup();
  },

  async mounted() {
    document.addEventListener('keyup', this.handleKeyPress);
    this.$refs?.containerShell?.$el?.addEventListener('focusin', this.focusInHandler);
    this.$refs?.xterm.addEventListener('focusout', this.focusOutHandler);

    const nodeId = this.pod.spec?.nodeName;

    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        await this.$store.dispatch('cluster/find', { type: NODE, id: nodeId });
      }
    } catch {}

    await this.setupTerminal();
    await this.connect();

    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(() => {
      this.fit();
    }, 60 * 1000);

    this.xtermContainerRef = this.$refs?.xterm;
  },

  methods: {
    focusInHandler(ev) {
      this.currFocusedElem = ev.target;
    },

    focusOutHandler(ev) {
      this.currFocusedElem = undefined;
    },

    handleKeyPress(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      // make focus leave the shell for it's parent container so that we can tab
      const didPressEscapeSequence = ev.shiftKey && ev.code === 'Escape';

      if (this.isXtermFocused && didPressEscapeSequence) {
        this.$refs.xterm.focus();
      }

      // if parent container is focused and we press a trigger, focus goes to the shell inside
      if (this.isXtermContainerFocused && (ev.code === 'Enter' || ev.code === 'Space')) {
        this.terminal?.textarea?.focus();
      }
    },

    async setupTerminal() {
      const docStyle = getComputedStyle(document.querySelector('body'));
      const xterm = await import(/* webpackChunkName: "xterm" */ 'xterm');

      const addons = await allHash({
        fit:      import(/* webpackChunkName: "xterm" */ 'xterm-addon-fit'),
        webgl:    import(/* webpackChunkName: "xterm" */ 'xterm-addon-webgl'),
        weblinks: import(/* webpackChunkName: "xterm" */ 'xterm-addon-web-links'),
        search:   import(/* webpackChunkName: "xterm" */ 'xterm-addon-search'),
        canvas:   import(/* webpackChunkName: "xterm" */ 'xterm-addon-canvas')
      });

      const terminal = new xterm.Terminal({
        theme: {
          background:          docStyle.getPropertyValue('--terminal-bg').trim(),
          foreground:          docStyle.getPropertyValue('--terminal-text').trim(),
          cursor:              docStyle.getPropertyValue('--terminal-cursor').trim(),
          selectionBackground: docStyle.getPropertyValue('--terminal-selection').trim(),
        },
        ...this.xtermConfig,
      });

      this.fitAddon = new addons.fit.FitAddon();
      this.searchAddon = new addons.search.SearchAddon();

      try {
        this.webglAddon = new addons.webgl.WebglAddon();
      } catch (e) {
        // Some browsers (Safari) don't support the webgl renderer, so don't use it.
        this.webglAddon = null;
        this.canvasAddon = new addons.canvas.CanvasAddon();
      }

      terminal.loadAddon(this.fitAddon);
      terminal.loadAddon(this.searchAddon);
      terminal.loadAddon(new addons.weblinks.WebLinksAddon());
      terminal.open(this.$refs.xterm);

      if (this.webglAddon) {
        terminal.loadAddon(this.webglAddon);
      } else {
        terminal.loadAddon(this.canvasAddon);
      }

      this.fit();
      this.flush();

      terminal.onData((input) => {
        const msg = `0${ base64Encode(input) }`;

        this.write(msg);
      });

      this.terminal = terminal;
    },

    write(msg) {
      if (this.isOpen) {
        this.socket.send(msg);
      } else {
        this.backlog.push(msg);
      }
    },

    clear() {
      this.terminal.clear();
    },

    getSocketUrl() {
      if (!this.pod?.links?.view) {
        return;
      }

      if (this.pod.os) {
        this.os = this.pod.os;
        this.backupShells = this.backupShells.filter((shell) => shell !== this.pod.os);
      } else {
        this.os = this.backupShells.shift();
      }

      const url = addParams(
        `${ this.pod.links.view.replace(/^http/, 'ws') }/exec`,
        {
          container: this.container,
          stdout:    1,
          stdin:     1,
          stderr:    1,
          tty:       1,
          command:   commands[this.os],
        }
      );

      return url;
    },

    async connect() {
      if (this.socket) {
        await this.socket.disconnect();
        this.socket = null;
        this.terminal.reset();
      }

      const url = this.getSocketUrl();

      if (!url) {
        return;
      }

      this.socket = new Socket(url, false, 0, 'base64.channel.k8s.io');

      this.socket.addEventListener(EVENT_CONNECTING, (e) => {
        this.isOpen = false;
        this.isOpening = true;
        this.errorMsg = '';
      });

      this.socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        this.isOpen = false;
        this.isOpening = false;
        console.error('Connect Error', e); // eslint-disable-line no-console
      });

      this.socket.addEventListener(EVENT_CONNECTED, (e) => {
        this.isOpen = true;
        this.isOpening = false;
        this.fit();
        this.flush();

        if (this.commandOnFirstConnect) {
          this.terminal.paste(`${ this.commandOnFirstConnect }`);
        }
      });

      this.socket.addEventListener(EVENT_DISCONNECTED, (e) => {
        this.isOpen = false;
        this.isOpening = false;

        // If we had an error message, try connecting with the next command
        if (this.errorMsg) {
          this.terminal.writeln(this.errorMsg);
          if (this.backupShells.length && this.retries < 2) {
            this.retries++;
            // we're not really counting on this being a reactive change so there's no need to fire the whole action
            this.pod.os = undefined;
            // the pod will still return an os if one's been defined in the node so we'll skip the backups if that's the case and rely on retry count to break the retry loop
            if (!this.pod.os) {
              this.os = undefined;
            }
            this.connect();
          } else {
            // Output an message to let he user know none of the shell commands worked
            const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

            this.terminal.writeln(`[${ timestamp }] ${ this.t('wm.containerShell.logLevel.info') }: ${ this.t('wm.containerShell.failed') }`);
          }
        }
      });

      this.socket.addEventListener(EVENT_MESSAGE, (e) => {
        const type = e.detail.data.substr(0, 1);
        const msg = base64Decode(e.detail.data.substr(1));

        this.errorMsg = '';

        if (`${ type }` === '1') {
          if (msg) {
            // we're not really counting on this being a reactive change so there's no need to fire the whole action
            this.pod.os = this.os;
          }
          this.terminal.write(msg);
        } else {
          const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
          let customError = `[${ timestamp }] ${ this.t('wm.containerShell.logLevel.error') }: ${ this.container }: ${ msg }`;

          if (msg.includes('stat /bin/sh: no such file or directory')) {
            customError = `[${ timestamp }] ${ this.t('wm.containerShell.logMessage.containerError', { logLevel: this.t('wm.containerShell.logLevel.error') }) }: ${ msg }`;
          }
          console.error(customError); // eslint-disable-line no-console

          if (`${ type }` === '3') {
            this.errorMsg = customError;
          }
        }
      });

      this.socket.connect();
      this.terminal.focus();
    },

    flush() {
      const backlog = this.backlog.slice();

      this.backlog = [];

      for (const data of backlog) {
        this.socket.send(data);
      }
    },

    fit(arg) {
      if (!this.fitAddon) {
        return;
      }

      this.fitAddon.fit();

      const { rows, cols } = this.fitAddon.proposeDimensions() || {};

      if (!this.isOpen) {
        return;
      }

      const message = `4${ base64Encode(
        JSON.stringify({
          Width:  Math.floor(cols),
          Height: Math.floor(rows),
        })
      ) }`;

      this.socket.send(message);
    },

    cleanup() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      if (this.terminal) {
        this.terminal.dispose();
        this.terminal = null;
      }
    },
  },
};
</script>

<template>
  <Window
    ref="containerShell"
    :active="active"
    :before-close="cleanup"
    class="container-shell"
  >
    <template #title>
      <Select
        v-if="containerChoices.length > 0"
        v-model:value="container"
        :disabled="containerChoices.length === 1"
        class="containerPicker auto-width pull-left"
        :options="containerChoices"
        :clearable="false"
        placement="top"
      >
        <template #selected-option="option">
          <t
            v-if="option"
            k="wm.containerShell.containerName"
            :label="option.label"
          />
        </template>
      </Select>
      <div class="pull-left ml-5">
        <button
          class="btn btn-sm role-primary"
          role="button"
          :aria-label="t('wm.containerShell.clear')"
          @click="clear"
        >
          <t
            data-testid="shell-clear-button-label"
            k="wm.containerShell.clear"
          />
        </button>
      </div>
      <div class="status pull-left">
        <t
          v-if="isOpen"
          k="wm.connection.connected"
          class="text-success"
        />
        <t
          v-else-if="isOpening"
          k="wm.connection.connecting"
          class="text-warning"
          :raw="true"
        />
        <t
          v-else
          k="wm.connection.disconnected"
          class="text-error"
          data-testid="shell-status-disconnected"
        />
        <span
          v-show="isXtermFocused"
          class="escape-text"
          role="alert"
          :aria-describedby="t('wm.containerShell.escapeText')"
        >{{ t('wm.containerShell.escapeText') }}</span>
      </div>
    </template>
    <template #body>
      <div
        class="shell-container"
        :class="{ open: isOpen, closed: !isOpen }"
      >
        <div
          ref="xterm"
          :tabindex="xTermContainerTabIndex"
          class="shell-body"
        />
        <resize-observer @notify="fit" />
      </div>
    </template>
  </Window>
</template>

<style lang="scss">
  .xterm-char-measure-element {
    position: static;
  }

.container-shell {
  .text-warning {
    animation: flasher 2.5s linear infinite;
  }

  .escape-text {
    font-size: 12px;
    margin-left: 20px;
  }

  @keyframes flasher {
    50% {
      opacity: 0;
    }
  }

  .shell-container {
    height: 100%;
    overflow: hidden;
    .resize-observer {
      display: none;
    }
  }

  .shell-body {
    padding: calc(2 * var(--outline-width));
    height: 100%;

    &:focus-visible, &:focus {
      @include focus-outline;
      outline-offset: -2px;
    }
  }

  .containerPicker.unlabeled-select {
    display: inline-block;
    min-width: 200px;
    height: 30px;
    min-height: 30px;
    width: initial;
  }

  .status {
    align-items: center;
    display: flex;
    min-width: 80px;
    height: 30px;
    margin-left: 10px;
  }
}
</style>
