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
        id="known-ssh-hosts-trigger"
        ref="button"
        role="button"
        :aria-label="t('secret.ssh.editKnownHosts.title')"
        data-testid="input-known-ssh-hosts_open-dialog"
        class="show-dialog-btn btn"
        @click="openDialog"
      >
        <i
          class="icon icon-edit"
          :alt="t('secret.ssh.editKnownHosts.title')"
        />
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
      background-color: transparent;
      padding: 4px;
      height: 22px;
      margin: -3px -3px 0 0;
      min-height: unset;

      &:focus-visible {
        @include focus-outline;
        outline-offset: 1px;
      }
    }
  }
</style>
