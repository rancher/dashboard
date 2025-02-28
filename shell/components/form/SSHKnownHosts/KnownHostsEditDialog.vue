<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';
import CodeMirror from '@shell/components/CodeMirror';
import FileSelector from '@shell/components/form/FileSelector.vue';
import AppModal from '@shell/components/AppModal.vue';

export default {
  emits: ['closed'],

  components: {
    FileSelector,
    AppModal,
    CodeMirror,
  },

  props: {
    value: {
      type:     String,
      required: true
    },

    mode: {
      type:    String,
      default: _EDIT
    },
  },

  data() {
    const codeMirrorOptions = {
      readOnly:        this.isView,
      gutters:         ['CodeMirror-foldgutter'],
      mode:            'text/x-properties',
      lint:            false,
      lineNumbers:     !this.isView,
      styleActiveLine: false,
      tabSize:         2,
      indentWithTabs:  false,
      cursorBlinkRate: 530,
    };

    return {
      codeMirrorOptions,
      text:      this.value,
      showModal: false,
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    onTextChange(value) {
      this.text = value?.trim();
    },

    showDialog() {
      this.showModal = true;
    },

    closeDialog(result) {
      if (!result) {
        this.text = this.value;
      }

      this.showModal = false;

      this.$emit('closed', {
        success: result,
        value:   this.text,
      });
    },
  }
};
</script>

<template>
  <app-modal
    v-if="showModal"
    ref="sshKnownHostsDialog"
    data-testid="sshKnownHostsDialog"
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
          <CodeMirror
            :value="text"
            data-testid="ssh-known-hosts-dialog_code-mirror"
            :options="codeMirrorOptions"
            :showKeyMapBox="true"
            @onInput="onTextChange"
          />
        </div>
        <div class="dialog-actions">
          <div class="action-pannel file-selector">
            <FileSelector
              class="btn role-secondary"
              data-testid="ssh-known-hosts-dialog_file-selector"
              :label="t('generic.readFromFile')"
              @selected="onTextChange"
            />
          </div>
          <div class="action-pannel form-actions">
            <button
              class="btn role-secondary"
              data-testid="ssh-known-hosts-dialog_cancel-btn"
              @click="closeDialog(false)"
            >
              {{ t('generic.cancel') }}
            </button>
            <button
              class="btn role-primary"
              data-testid="ssh-known-hosts-dialog_save-btn"
              @click="closeDialog(true)"
            >
              {{ t('generic.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </app-modal>
</template>

<style lang="scss" scoped>
  .ssh-known-hosts-dialog {
    padding: 15px;

    h4 {
      font-weight: bold;
      margin-bottom: 20px;
    }

    .dialog-panel {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      :deep() .code-mirror {
        display: flex;
        flex-direction: column;
        resize: none;

        .codemirror-container {
          border: 1px solid var(--border);
        }

        .CodeMirror,
        .CodeMirror-gutters {
          min-height: 400px;
          max-height: 400px;
          background-color: var(--yaml-editor-bg);
        }

        .CodeMirror-gutters {
          width: 25px;
        }

        .CodeMirror-linenumber {
          padding-left: 0;
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;

      .action-pannel {
        margin-top: 10px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;

        > *:not(:last-child) {
          margin-right: 10px;
        }
      }
    }
  }
</style>
