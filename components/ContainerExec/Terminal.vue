<script>
export default {
  props: {
    allowInput: { type: Boolean, default: true },
    config:     {
      type:    Object,
      default: () => {
        return {
          cursorblink:  true,
          useStyle:     true,
          fontSize:     12,

        };
      }
    },
    theme: {
      type:    Object,
      default: () => {
        return {
          background: '#141419',
          cursor:     'rgba(39,170,94,1)',
          foreground: 'rgba(39,170,94,1)'
        };
      }
    },
    lines: {
      type:    Array,
      default: () => []
    }
  },
  data() {
    return {
      terminal: null,
      fitAddon: null,
      xterm:    null
    };
  },
  watch:    {
    lines(newLines) {
      if (this.terminal && newLines.length) {
        newLines.forEach(line => this.terminal.write(line));
        this.$emit('clearBacklog');
      }
    }
  },
  beforeDestroy() {
    this.terminal.dispose();
  },
  mounted() {
    // dynamically import xterm in mounted() to avoid problems with ssr
   import('xterm')
     .then((xterm) => {
       console.log('xterm imported');
       this.xterm = xterm;
     })
     .then(() => {
       return import('xterm-addon-fit');
     })
     .then((fitAddon) => {
       this.fitAddon = new fitAddon.FitAddon();
     })
     .then(() => {
       this.drawTerminal();
     });
  },
  methods: {
    drawTerminal() {
      const vm = this;
      const terminal = new this.xterm.Terminal({
        ...vm.config,
        disableStdin: !vm.allowInput,
        theme:        this.theme
      });

      this.terminal = terminal;
      this.terminal.loadAddon(this.fitAddon);
      this.terminal.open(this.$refs.terminal);
      this.fitTerminal();
      this.lines.forEach(line => this.terminal.write(line));
      this.$emit('clearBacklog');
      terminal.onData((input) => {
        this.$emit('input', input);
      });
    },
    fitTerminal(arg) {
      if (this.fitAddon) {
        this.fitAddon.fit();
        this.$emit('resized', this.fitAddon.proposeDimensions());
      }
    },
  }
};
</script>

<template>
  <div id="terminal-container">
    <div id="terminal" ref="terminal" class="terminal">
    </div>
    <resize-observer @notify="fitTerminal" />
  </div>
</template>

<style lang="scss">
  #terminal-container {
    padding: 5px;
    height: 100%;
    overflow: hidden;
    & .xterm-viewport {
      scroll-behavior: smooth;
    }
  }
</style>
