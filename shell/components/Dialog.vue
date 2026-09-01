<script>
import AsyncButton from '@shell/components/AsyncButton';
import AppModal, { DEFAULT_ITERABLE_NODE_SELECTOR } from '@shell/components/AppModal.vue';

export default {
  emits: ['okay', 'closed'],

  components: { AsyncButton, AppModal },

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
    },

    /**
     * forcefully set return focus element based on this selector
     */
    returnFocusSelector: {
      type:    String,
      default: '',
    },

    /**
     * will return focus to the first iterable node of this container select
     */
    returnFocusFirstIterableNodeSelector: {
      type:    String,
      default: DEFAULT_ITERABLE_NODE_SELECTOR,
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
        this.$emit('closed', result);
        this.closed = true;
      }
    },
  }
};
</script>

<template>
  <app-modal
    v-if="!closed"
    :name="name"
    height="auto"
    :scrollable="true"
    :trigger-focus-trap="true"
    :return-focus-selector="returnFocusSelector"
    :return-focus-first-iterable-node-selector="returnFocusFirstIterableNodeSelector"
    @close="closeDialog(false)"
    @before-open="beforeOpen"
  >
    <div class="modal-dialog">
      <h4>
        {{ title }}
      </h4>
      <slot />
      <div class="dialog-buttons mt-20">
        <slot name="buttons" />
        <div v-if="!$slots.buttons">
          <button
            class="btn role-secondary"
            @click="closeDialog(false)"
          >
            {{ t('generic.cancel') }}
          </button>
          <button
            v-if="!mode"
            class="btn role-primary ml-10"
            @click="closeDialog(true)"
          >
            {{ t('generic.ok') }}
          </button>
          <AsyncButton
            v-else
            :mode="mode"
            class="ml-10"
            @click="ok"
          />
        </div>
      </div>
    </div>
  </app-modal>
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
