<script lang="ts">
import { defineComponent } from 'vue';
import EditDialog from './KnownHostsEditDialog.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default defineComponent({
  name: 'SSHKnownHosts',

  emits: ['update:value'],

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

  components: { EditDialog },

  computed: {
    isViewMode() {
      return this.mode === _VIEW;
    },

    // Summarize number of entries - exclude empty lines and comments
    summary() {
      const lines = this.value.split('\n').filter((line: string) => !!line.length && !line.startsWith('#')).length;

      return this.t('secret.ssh.editKnownHosts.entries', { entries: lines });
    }
  },

  methods: {
    openDialog() {
      (this.$refs.button as HTMLInputElement)?.blur();
      (this.$refs.editDialog as any).showDialog(this.value);
    },

    dialogClosed(result: any) {
      if (result.success) {
        this.$emit('update:value', result.value);
      }
    }
  }
});
</script>
<template>
  <div class="input-known-ssh-hosts labeled-input">
    <label>{{ t('secret.ssh.knownHosts') }}</label>
    <div
      class="hosts-input"
    >
      {{ summary }}
    </div>
    <button
      v-if="!isViewMode"
      ref="button"
      class="show-dialog btn"
      @click="openDialog"
    >
      ...
    </button>
    <EditDialog
      v-if="!isViewMode"
      ref="editDialog"
      @closed="dialogClosed"
    />
  </div>
</template>
<style lang="scss" scoped>
  .input-known-ssh-hosts {
    $ssKnownHostsButtonHeight: 20px;

    .hosts-input {
      cursor: default;
      line-height: calc(18px + 1px);
      padding: 18px 0 0 0;
    }

    .show-dialog {
      position: absolute;
      top: 28px;
      padding: 0 6px;
      min-height: $ssKnownHostsButtonHeight;
      line-height: $ssKnownHostsButtonHeight;
      right: 4px;

      &:hover, &:focus {
        border-color: var(--primary);
        //color: var(--primary);
        // TODO: Don't use hard-coded color
        color: #fff
      }
    }
  }
</style>
