<script>
import { allHash } from '@shell/utils/promise';
import { addParams } from '@shell/utils/url';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import Select from '@shell/components/form/Select';

import Socket, {
  EVENT_CONNECTED,
  EVENT_CONNECTING,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  EVENT_CONNECT_ERROR,
} from '@shell/utils/socket';
import Window from '@shell/components/nav/WindowManager/Window';
import ApplicationSocketMixin from './ApplicationSocketMixin';

export default {
  components: { Window, Select },

  mixins: [ApplicationSocketMixin],

  props: {
    // The instance in the application to initially show
    initialInstance: {
      type:    String,
      default: null,
    },
  },

  data() {
    return {
      instance:       this.initialInstance || this.instanceChoices[0],
      terminal:       null,
      fitAddon:       null,
      searchAddon:    null,
      webglAddon:     null,
      isOpening:      false,
      keepAliveTimer: null,
    };
  },

  computed: {
    xtermConfig() {
      return {
        cursorBlink: true,
        useStyle:    true,
        fontSize:    12,
      };
    },

  },

  watch: {
    instance() {
      this.connect();
    },

    height() {
      this.fit();
    },
  },

  beforeDestroy() {
    clearInterval(this.keepAliveTimer);
    this.cleanup();
  },

  async mounted() {
    await this.setupTerminal();
    await this.connect();

    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(() => {
      this.fit();
    }, 60 * 1000);
  },

  methods: {
    async setupTerminal() {
      const docStyle = getComputedStyle(document.querySelector('body'));
      const xterm = await import(/* webpackChunkName: "xterm" */ 'xterm');

      const addons = await allHash({
        fit:      import(/* webpackChunkName: "xterm" */ 'xterm-addon-fit'),
        webgl:    import(/* webpackChunkName: "xterm" */ 'xterm-addon-webgl'),
        weblinks: import(/* webpackChunkName: "xterm" */ 'xterm-addon-web-links'),
        search:   import(/* webpackChunkName: "xterm" */ 'xterm-addon-search'),
      });

      const terminal = new xterm.Terminal({
        theme: {
          background: docStyle.getPropertyValue('--terminal-bg').trim(),
          cursor:     docStyle.getPropertyValue('--terminal-cursor').trim(),
          selection:  docStyle.getPropertyValue('--terminal-selection').trim(),
          foreground: docStyle.getPropertyValue('--terminal-text').trim(),
        },
        ...this.xtermConfig,
      });

      this.fitAddon = new addons.fit.FitAddon();
      this.searchAddon = new addons.search.SearchAddon();

      try {
        this.webglAddon = new addons.webgl.WebGlAddon();
      } catch (e) {
        // Some browsers (Safari) don't support the webgl renderer, so don't use it.
        this.webglAddon = null;
      }

      terminal.loadAddon(this.fitAddon);
      terminal.loadAddon(this.searchAddon);
      terminal.loadAddon(new addons.weblinks.WebLinksAddon());
      terminal.open(this.$refs.xterm);

      if (this.webglAddon) {
        terminal.loadAddon(this.webglAddon);
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

    async getSocketUrl() {
      const { url, token } = await this.getRootSocketUrl();

      return addParams(url, {
        authtoken: token,
        instance:  this.instance,
      });
    },

    async connect() {
      if (this.socket) {
        await this.socket.disconnect();
        this.socket = null;
        this.terminal.reset();
      }

      const url = await this.getSocketUrl();

      if (!url) {
        return;
      }

      this.socket = new Socket(url, false, 0, 'base64.channel.k8s.io');

      this.socket.addEventListener(EVENT_CONNECTING, (e) => {
        this.isOpen = false;
        this.isOpening = true;
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
      });

      this.socket.addEventListener(EVENT_DISCONNECTED, (e) => {
        this.isOpen = false;
        this.isOpening = false;
      });

      this.socket.addEventListener(EVENT_MESSAGE, (e) => {
        const type = e.detail.data.substr(0, 1);
        const msg = base64Decode(e.detail.data.substr(1));

        if (`${ type }` === '1') {
          this.terminal.write(msg);
        } else {
          console.error(msg); // eslint-disable-line no-console
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

      const { rows, cols } = this.fitAddon.proposeDimensions();

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
  <Window :active="active" :before-close="cleanup" class="epinio-app-shell">
    <template #title>
      <Select
        v-if="instanceChoices.length > 1"
        v-model="instance"
        :disabled="instanceChoices.length === 1"
        class="containerPicker auto-width pull-left"
        :options="instanceChoices"
        :clearable="false"
        placement="top"
      >
        <template #selected-option="option">
          <t
            v-if="option"
            k="epinio.applications.wm.containerName"
            :label="option.label"
          />
        </template>
      </Select>
      <div class="pull-left ml-5">
        <button class="btn btn-sm bg-primary" @click="clear">
          <t k="wm.containerShell.clear" />
        </button>
      </div>
      <div class="status pull-left">
        <t v-if="isOpen" k="wm.connection.connected" class="text-success" />
        <t
          v-else-if="isOpening"
          k="wm.connection.connecting"
          class="text-warning"
          :raw="true"
        />
        <t v-else k="wm.connection.disconnected" class="text-error" />
      </div>
    </template>
    <template #body>
      <div class="shell-container" :class="{ open: isOpen, closed: !isOpen }">
        <div ref="xterm" class="shell-body" />
        <resize-observer @notify="fit" />
      </div>
    </template>
  </Window>
</template>

<style lang="scss">
.epinio-app-shell {
  .v-select.inline.vs--single.vs--open .vs__selected {
    position: inherit;
  }
}
</style>

<style lang="scss" scoped>
.text-warning {
  animation: flasher 2.5s linear infinite;
}

@keyframes flasher {
  50% {
    opacity: 0;
  }
}

.shell-container {
  height: 100%;
  overflow: hidden;
}

.shell-body {
  padding: calc(2 * var(--outline-width));
  height: 100%;

  & > .terminal.focus {
    outline: var(--outline-width) solid var(--outline);
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

.status {
  align-items: center;
  display: flex;
  min-width: 80px;
  height: 30px;
  margin-left: 10px;
}
</style>
