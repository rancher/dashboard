<script>
import AsyncButton from '@shell/components/AsyncButton';

export default {
  components: { AsyncButton },

  props: {
    name: {
      type:     String,
      required: true,
    },

    title: {
      type:     String,
      required: true,
    },

    mode: {
      type:    String,
      default: '',
    }
  },

  data() {
    return { closed: false };
  },

  methods: {
    beforeOpen() {
      this.closed = false;
    },

    ok(btnCb) {
      const callback = (ok) => {
        btnCb(ok);
        if (ok) {
          this.closeDialog(true);
        }
      };

      this.$emit('okay', callback);
    },

    closeDialog(result) {
      if (!this.closed) {
        this.$modal.hide(this.name);
        this.$emit('closed', result);
        this.closed = true;
      }
    },
  }
};
</script>

<template>
  <modal
    :name="name"
    height="auto"
    :scrollable="true"
    @closed="closeDialog(false)"
    @before-open="beforeOpen"
  >
    <div class="modal-dialog">
      <h4>
        {{ title }}
      </h4>
      <slot></slot>
      <div class="dialog-buttons mt-20">
        <slot name="buttons"></slot>
        <div v-if="!$slots.buttons">
          <button class="btn role-secondary" @click="closeDialog(false)">
            {{ t('generic.cancel') }}
          </button>
          <button v-if="!mode" class="btn role-primary ml-10" @click="closeDialog(true)">
            {{ t('generic.ok') }}
          </button>
          <AsyncButton v-else :mode="mode" class="ml-10" @click="ok" />
        </div>
      </div>
    </div>
  </modal>
</template>

<style lang="scss" scoped>
  .modal-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
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
