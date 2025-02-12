<script lang="ts">
import { defineComponent } from 'vue';
import KnownHostsEditDialog from './KnownHostsEditDialog.vue';
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

  components: { KnownHostsEditDialog },

  computed: {
    isViewMode() {
      return this.mode === _VIEW;
    },

    // The number of entries - exclude empty lines and comments
    entries() {
      return this.value.split('\n').filter((line: string) => !!line.trim().length && !line.startsWith('#')).length;
    },

    summary() {
      return this.t('secret.ssh.editKnownHosts.entries', { entries: this.entries });
    }
  },

  methods: {
    openDialog() {
      (this.$refs.button as HTMLInputElement)?.blur();
      (this.$refs.editDialog as any).showDialog();
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
  <div
    class="input-known-ssh-hosts labeled-input"
    data-testid="input-known-ssh-hosts"
  >
    <label>{{ t('secret.ssh.knownHosts') }}</label>
    <div
      class="hosts-input"
      data-testid="input-known-ssh-hosts_summary"
    >
      {{ summary }}
    </div>
    <template v-if="!isViewMode">
      <button
        ref="button"
        data-testid="input-known-ssh-hosts_open-dialog"
        class="show-dialog-btn btn"
        @click="openDialog"
      >
        <i class="icon icon-edit" />
      </button>

      <KnownHostsEditDialog
        ref="editDialog"
        :value="value"
        :mode="mode"
        @closed="dialogClosed"
      />
    </template>
  </div>
</template>
<style lang="scss" scoped>
  .input-known-ssh-hosts {
    display: flex;
    justify-content: space-between;

    .hosts-input {
      cursor: default;
      line-height: calc(18px + 1px);
      padding: 18px 0 0 0;
    }

    .show-dialog-btn {
      display: contents;
      background-color: transparent;
    }
  }
</style>
