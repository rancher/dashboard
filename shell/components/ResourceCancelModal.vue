<script>
import AppModal from '@shell/components/AppModal.vue';

export default {
  emits: ['cancel-cancel', 'confirm-cancel'],

  components: { AppModal },

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

  data() {
    return { showModal: false };
  },

  watch: {},

  methods: {
    show() {
      this.showModal = true;
    },

    /**
     * Close the modal, no op
     */
    cancelCancel() {
      this.showModal = false;

      this.$emit('cancel-cancel');
    },

    /**
     * Close the modal, cancel has been confirmed
     */
    confirmCancel() {
      this.showModal = false;

      this.$emit('confirm-cancel', this.isCancelModal);
    },
  }
};
</script>

<template>
  <app-modal
    v-if="showModal"
    customClass="confirm-modal"
    name="cancel-modal"
    :width="440"
    height="auto"
    @close="cancelCancel"
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
  </app-modal>
</template>

<style lang='scss' scoped>
 .confirm-modal {
  .btn {
    margin: 0 10px;
  }

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
</style>
