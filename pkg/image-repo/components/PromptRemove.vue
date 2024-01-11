<template>
  <div
    v-if="show"
    class="dialog"
  >
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>{{ t('promptRemove.title') }}</h2>
      </div>
      <div class="dialog-body">
        {{ t('promptRemove.attemptingToRemove', { type }) }} <span
          v-clean-html="resourceNames(names, plusMore, t)"
        />
      </div>
      <div class="dialog-footer">
        <button
          v-loading="loading"
          type="button"
          class="btn role-secondary mr-10"
          :disabled="loading"
          @click="closeDialog"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="delete"
          class="btn bg-error ml-10"
          :disabled="loading"
          @click="remove"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { escapeHtml, resourceNames } from '@shell/utils/string';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  name:       'Dialog',
  components: { AsyncButton },
  props:      {
    type: {
      type:    String,
      default: 'resource',
    },
    show: {
      type:    Boolean,
      default: false,
    },
    resources: {
      type:     Array,
      required: true,
    },
    removeCallback: {
      type:     Function,
      required: true,
    }
  },
  data() {
    return { loading: false };
  },
  computed: {
    plusMore() {
      const remaining = this.names.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },
    names() {
      return this.resources.map((r) => r.name);
    }
  },
  methods: {
    resourceNames,
    escapeHtml,
    closeDialog() {
      this.$emit('close');
    },
    async remove() {
      this.loading = true;
      try {
        await this.removeCallback(this.resources.map((r) => r.id));

        this.$emit('removed');
      } catch (err) {
        this.$store.dispatch('growl/warning', {
          title:   err?.code,
          message: err?.message
        }, { root: true });
      }
      this.closeDialog();
      this.loading = false;
    }
  },
};
</script>

<style lang="scss" scoped>
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 20;

  .dialog-content {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
      margin-bottom: 10px;
      H2 {
        margin: 0;
      }
    }
    .dialog-body {
      padding: 10px;
    }
    .dialog-footer {
      display: flex;
      align-items: center;
      padding-bottom: 10px;
      justify-content: flex-end;
    }
  }
}
</style>
