<script>
import Window from './Window';
import { allHash } from '@/utils/promise';
import { addParams } from '@/utils/url';
import { base64Decode, base64Encode } from '@/utils/crypto';

import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@/utils/socket';

const DEFAULT_COMMAND = ['/bin/sh', '-c', 'TERM=xterm-256color; export TERM; [ -x /bin/bash ] && ([ -x /usr/bin/script ] && /usr/bin/script -q -c "/bin/bash" /dev/null || exec /bin/bash) || exec /bin/sh'];

export default {
  components: { Window },

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
      terminal:    null,
      fitAddon:    null,
      searchAddon: null,
      isOpen:      false,
      backlog:     []
    };
  },

  computed: {
    xtermConfig() {
      return {
        cursorBlink:  true,
        useStyle:     true,
        fontSize:     12,
      };
    },

    containerChoices() {
      return this.pod.spec.containers.map(x => x.name);
    },
  },

  watch: {
    height() {
      this.fit();
    }
  },

  beforeDestroy() {
    this.socket.disconnect();
    this.terminal.dispose();
  },

  async mounted() {
    await this.setupTerminal();
    await this.connect();
  },

  methods: {
    async setupTerminal() {
      const docStyle = getComputedStyle(document.querySelector('body'));
      const xterm = await import('xterm');

      const addons = await allHash({
        fit:      import('xterm-addon-fit'),
        webgl:    import('xterm-addon-webgl'),
        weblinks: import('xterm-addon-web-links'),
        search:   import('xterm-addon-search'),
      });

      const terminal = new xterm.Terminal({
        theme: {
          background: docStyle.getPropertyValue('--terminal-bg').trim(),
          cursor:     docStyle.getPropertyValue('--terminal-cursor').trim(),
          foreground: docStyle.getPropertyValue('--terminal-text').trim()
        },
        ...this.xtermConfig,
      });

      this.fitAddon = new addons.fit.FitAddon();
      this.searchAddon = new addons.search.SearchAddon();

      terminal.loadAddon(this.fitAddon);
      terminal.loadAddon(this.searchAddon);
      terminal.loadAddon(new addons.weblinks.WebLinksAddon());
      terminal.open(this.$refs.xterm);
      terminal.loadAddon(new addons.webgl.WebglAddon());

      this.fit();
      this.flush();

      terminal.onData((input) => {
        const msg = `0${ base64Encode(input) }`;

        this.write(msg);
      });

      this.terminal = terminal;
    },

    write(msg) {
      if ( this.isOpen ) {
        this.socket.send(msg);
      } else {
        this.backlog.push(msg);
      }
    },

    clear() {
      this.terminal.clear();
    },

    async connect() {
      if ( this.socket ) {
        await this.socket.disconnect();
        this.socket = null;
        this.terminal.reset();
      }

      const url = addParams(`${ this.pod.links.view.replace(/^http/, 'ws') }/exec`, {
        container: this.container,
        stdout:    1,
        stdin:     1,
        stderr:    1,
        tty:       1,
        command:   DEFAULT_COMMAND,
      });

      this.socket = new Socket(url, false, 0, 'base64.channel.k8s.io');
      this.socket.addEventListener(EVENT_CONNECTED, (e) => {
        this.isOpen = true;
        this.fit();
        this.flush();
      });

      this.socket.addEventListener(EVENT_DISCONNECTED, (e) => {
        this.isOpen = false;
      });

      this.socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        this.isOpen = false;
        console.error('Connect Error', e); // eslint-disable-line no-console
      });

      this.socket.addEventListener(EVENT_MESSAGE, (e) => {
        const type = e.detail.data.substr(0, 1);
        const msg = base64Decode(e.detail.data.substr(1));

        if ( `${ type }` === '1' ) {
          this.terminal.write(msg);
        } else {
          console.error(msg); // eslint-disable-line no-console
        }
      });

      this.socket.connect();
      this.terminal.focus();
    },

    switchTo(container) {
      this.container = container;
      this.connect();
    },

    flush() {
      const backlog = this.backlog.slice();

      this.backlog = [];

      for ( const data of backlog ) {
        this.socket.send(data);
      }
    },

    fit(arg) {
      this.fitAddon.fit();

      const { rows, cols } = this.fitAddon.proposeDimensions();

      if ( !this.isOpen ) {
        return;
      }

      const message = `4${ base64Encode(JSON.stringify({
        Width:  cols,
        Height: rows
      })) }`;

      this.socket.send(message);
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
          <t v-if="option" k="wm.containerShell.containerName" :label="option.label" />
        </template>
      </v-select>
      <button class="btn btn-sm bg-primary" @click="clear">
        <t k="wm.containerShell.clear" />
      </button>
      <div class="pull-right">
        <t :class="{'text-error': !isOpen}" :k="isOpen ? 'wm.connection.connected' : 'wm.connection.disconnected'" />
      </div>
    </template>
    <template #body>
      <div class="shell-container" :class="{'open': isOpen, 'closed': !isOpen}">
        <div ref="xterm" class="shell-body" />
        <resize-observer @notify="fit" />
      </div>
    </template>
  </Window>
</template>

<style lang="scss">
  @import '@/node_modules/xterm/css/xterm.css';

  .shell-container {
    height: 100%;
    overflow: hidden;
  }

  .shell-body {
    padding: calc( 2 * var(--outline-width) );
    height: 100%;

    & > .terminal.focus {
      outline: var(--outline-width) solid var(--outline);
    }
  }
</style>
