<script>
import AppModal from '@shell/components/AppModal.vue';

export default {
  emits: ['closed'],

  components: { AppModal },

  data() {
    return {
      data:                   '',
      currentVersion:         '',
      defaultRegistrySetting: null,
      plugin:                 undefined,
      busy:                   false,
      version:                '',
      update:                 false,
      mode:                   '',
      showModal:              false,
      chartVersionInfo:       null
    };
  },

  methods: {
    showDialog(data) {
      this.showModal = true;
      this.data = data;
    },

    closeDialog(result) {
      this.showModal = false;

      const value = (this.$refs.textbox)?.value;

      this.$emit('closed', {
        success: result,
        value,
      });
    },
  }
};
</script>

<template>
  <app-modal
    v-if="showModal"
    name="sshKnownHostsDialog"
    height="auto"
    :scrollable="true"
    @close="closeDialog(false)"
  >
    <div
      class="ssh-known-hosts-dialog"
    >
      <h4 class="mt-10">
        {{ t('secret.ssh.editKnownHosts.title') }}
      </h4>
      <div class="custom mt-10">
        <div class="dialog-panel">
          <textarea
            ref="textbox"
            :value="data"
            class="edit-box"
          />
        </div>
        <div class="dialog-buttons">
          <button
            :disabled="busy"
            class="btn role-secondary"
            data-testid="ssh-known-hosts-dialog-cancel-btn"
            @click="closeDialog(false)"
          >
            {{ t('generic.cancel') }}
          </button>
          <button
            class="btn role-primary"
            data-testid="ssh-known-hosts-dialog-save-btn"
            @click="closeDialog(true)"
          >
            {{ t('generic.save') }}
          </button>
        </div>
      </div>
    </div>
  </app-modal>
</template>

<style lang="scss" scoped>
  .ssh-known-hosts-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
    }

    .dialog-panel {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      .edit-box {
        font-family: monospace;
        font-size: 12px;
        resize: none;
        max-height: 400px;
        height: 50vh;
        padding: 10px;
      }

      p {
        margin-bottom: 5px;
      }

      .dialog-info {
        flex: 1;
      }

      .toggle-advanced {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin: 10px 0;

        &:hover {
          text-decoration: none;
          color: var(--link);
        }
      }

      .version-selector {
        margin: 0 10px 10px 10px;
        width: auto;
      }
    }

    .dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;

      > *:not(:last-child) {
        margin-right: 10px;
      }
    }
  }
</style>
