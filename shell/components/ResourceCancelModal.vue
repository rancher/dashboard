<script>
export default {
  props: {
    isCancelModal: {
      type:    Boolean,
      default: false
    },
    isForm: {
      type:    Boolean,
      default: false
    },
  },

  watch: {},

  methods: {
    show() {
      this.$modal.show('cancel-modal');
    },

    /**
     * Close the modal, no op
     */
    cancelCancel() {
      this.$modal.hide('cancel-modal');

      this.$emit('cancel-cancel');
    },

    /**
     * Close the modal, cancel has been confirmed
     */
    confirmCancel() {
      this.$modal.hide('cancel-modal');

      this.$emit('confirm-cancel', this.isCancelModal);
    },
  }
};
</script>

<template>
  <modal
    class="confirm-modal"
    name="cancel-modal"
    :width="440"
    height="auto"
  >
    <div class="header">
      <h4 class="text-default-text">
        <t
          v-if="isCancelModal"
          k="generic.cancel"
        />
        <span v-else>{{ t("cruResource.backToForm") }}</span>
      </h4>
    </div>
    <div class="body">
      <p v-if="isCancelModal">
        <t k="cruResource.cancelBody" />
      </p>
      <p v-else>
        <t k="cruResource.backBody" />
      </p>
    </div>
    <div class="footer">
      <button
        type="button"
        class="btn role-secondary"
        @click="cancelCancel"
      >
        {{ isForm ? t("cruResource.reviewForm") : t("cruResource.reviewYaml") }}
      </button>
      <button
        type="button"
        class="btn role-primary"
        @click="confirmCancel"
      >
        <span v-if="isCancelModal">{{ t("cruResource.confirmCancel") }}</span>
        <span v-else>{{ t("cruResource.confirmBack") }}</span>
      </button>
    </div>
  </modal>
</template>

<style lang='scss' scoped>
 .confirm-modal {
  .btn {
    margin: 0 10px;
  }

  .v--modal-box {
    background-color: var(--default);
    box-shadow: none;
    min-height: 200px;
    .body {
      min-height: 75px;
      padding: 10px 0 0 15px;
      p {
        margin-top: 10px;
      }
    }
    .header {
      background-color: var(--error);
      padding: 15px 0 0 15px;
      height: 50px;

      h4 {
        color: white;
      }
    }
    .footer {
      border-top: 1px solid var(--border);
      text-align: center;
      padding: 10px 0 0 15px;
      height: 60px;
    }
  }
}
</style>
