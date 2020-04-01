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
      } else {
        this.$modal.hide('terminal');
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
    :click-to-close="false"
    :adaptive="true"
    width="95%"
    height="95%"
    @before-close="hide"
  >
    <div class="controls-top">
      <span v-show="containers.length>1">
        <span class="fake-icon">
          ≥
        </span>
        <v-select
          class="inline"
          :clearable="false"
          :value="container"
          :options="containers"
          label="name"
          @input="selectContainer"
        >
        </v-select>
      </span>
      <button type="button" class="btn role-secondary icon icon-btn icon-close" @click="hide" />
    </div>
    <div v-if="containers.length<=1" class="label-top">
      <span>
        {{ container.name }}
      </span>
    
      <div class="connection-status" :class="{disconnected: !isOpen}">
        <span v-if="!isOpen">Disconnected</span>
        <span v-else>Connected</span>
      </div>
    </div>
    <!-- use bound key here to make the terminal re-render every time container changes -->
    <Terminal
      v-if="mode==='openShell'"
      :key="container.name"
      :lines="backlog"
      :is-open="isOpen"
      @clearBacklog="$store.commit('shell/clearBacklog')"
      @resized="resized"
      @input="terminalInput"
      @terminalReady="terminalReady"
    />
    <Logs v-if="mode==='openLogs'" :backlog="backlog" />
  </modal>
</template>

<style lang="scss">
@import '@/node_modules/xterm/css/xterm.css';

  .v--modal {
    background-color: var(--box-bg);
    position: absolute;
  }

  .v--modal-box{
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px -2px rgba(0,0,0,0.5);
    border: 1px solid var(--border);

    &  > :last-child{
      flex-grow: 1;
    }
  }

  #terminal, .logs{
    flex-grow:1;
    width: 95%;
    height: 95%;
    margin: auto;
    padding: 10px;
    background-color: var(--body-bg);
    border: solid thin var(--border);
    border-radius: var(--border-radius);
    & .datestring {
        color: var(--input-label)
      }
  }

   .xterm, .xterm-viewport{
    width: 100%;
    height: 100%;
    background-color: var(--nav-bg );

      & div {
        color: rgba(39,170,94,1);
      }
  }
  .controls-top, .label-top {
    color: var(--dropdown-text);
    width:95%;
    margin: auto;
    padding: 20px 0 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    & .fake-icon{
      font-size: 1.5em;
      padding: 8px 8px 8px 8px;
      margin: 0;
      border:none;
      color: var(--input-text);
    }

    & > :first-child{
      display: flex;
      flex-grow: 1;
    }

    & .v-select{
        min-width: 300px;
        flex-basis: 0%;
        border: none;

      & .vs__dropdown-toggle {
        border: none;
        background: var(--input-bg);
      }

      & .vs__selected{
        top: 0.4rem;
      }
    }

    & button.icon-close {
      border:none;
      transform: scale(2);
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }

  .connection-status{
    width: 95%;
    margin: auto;
    display: flex;
    justify-content: flex-end;
    z-index: 1;
    &.disconnected{
      color: var(--error);
    }
    &:not(.disconnected) {
      color: var(--success);
    }
  }
</style>
