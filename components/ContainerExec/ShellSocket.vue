/* eslint-disable vue/html-quotes */
<script>
import { mapState } from 'vuex';
import { base64Encode } from '@/utils/crypto';
import Terminal from '@/components/ContainerExec/Terminal';
import Logs from '@/components/ContainerExec/Logs';
export default {
  components: { Terminal, Logs },
  data() {
    return { terminal: null };
  },
  computed: {
    ...mapState('shell', ['containers', 'container', 'socket', 'mode', 'backlog']),
    isOpen() {
      return this.socket.readyState === 1;
    }
  },
  watch:    {
    mode(newProp) {
      if (newProp) {
        this.$modal.show('terminal');
      }
    }
  },
  methods:  {
    hide() {
      this.$store.dispatch('shell/closeSocket');
      this.$store.commit('shell/closeModal');
    },

    selectContainer(container) {
      this.$store.dispatch('shell/closeSocket')
        .then(() => {
          this.$store.dispatch('shell/defineSocket', { container });
        });
    },
    resized({ rows, cols }) {
      if (this.isOpen) {
        const message = `4${ base64Encode(JSON.stringify({
          Width:  cols,
          Height: rows
        })) }`;

        this.socket.send(message);
      }
    },
    terminalReady(payload) {
      this.terminal = payload.terminal;
      if (this.isOpen) {
        this.backlog.forEach(log => payload.terminal.write(log));
      }
    },
    terminalInput(input) {
      this.$store.commit('shell/sendInput', { input });
    }
  }
};
</script>

<template>
  <modal
    ref="modal"
    name="terminal"
    :resizable="true"
    :adaptive="true"
    height="auto"
    @before-close="hide"
  >
    <div v-if="containers.length>1" class="controls-top">
      <span>
        ≥
      </span>
      <v-select
        :clearable="false"
        :value="container"
        :options="containers"
        label="name"
        @input="selectContainer"
      >
      </v-select>
    </div>
    <div v-if="containers.length<=1" class="label-top">
      <span>
        ≥ {{ container.name }}
      </span>
    </div>
    <!-- use bound key here to make the terminal re-render every time container changes -->
    <Terminal
      v-if="mode==='openShell'"
      :key="container.name"
      :lines="backlog"
      :class=" { disconnected: !isOpen }"
      :is-open="isOpen"
      @clearBacklog="$store.commit('shell/clearBacklog')"
      @resized="resized"
      @input="terminalInput"
      @terminalReady="terminalReady"
    />
    <Logs v-if="mode==='openLogs'" :class=" { disconnected: !isOpen }" :backlog="backlog" />
  </modal>
</template>

<style lang="scss">
@import '@/node_modules/xterm/css/xterm.css';
  .v--modal-box{
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px -2px rgba(0,0,0,0.3);

    &  > :nth-child(2){
      flex-grow: 1;
    }
  }
  .terminal, .xterm, .xterm-viewport{
    width: 100%;
    height: 100%;
    background-color: var(--nav-bg );

      & .datestring {
        color: var(--input-label)
      }

      & div {
        color: rgba(39,170,94,1);
      }
  }
  .controls-top, .label-top {
    color: var(--dropdown-text);
    margin: 5px;
    display: flex;
    align-items: center;

    & .v-select{
      flex-grow: 1;
      flex-basis: 0%;
      border: none;

    & .vs__dropdown-toggle {
      border: none;
      background: var(--input-bg);
    }
    & .vs__selected{
      position: absolute;
      top: 25%;
      color: var(--dropdown-text)
    }
  }}

  .label-top{
    margin: 15px;
  }

  .v--modal {
    background-color: var(--box-bg);
  }

  .disconnected{
     & > :nth-child(1) {
       border: 1px solid red;
     }
    }
    .socket-status{
      // border: 1px dashed red;
      align-self: flex-end;
      position: relative;
      top: 20px;
      right: 10px;
      z-index: 1;
    }
</style>
