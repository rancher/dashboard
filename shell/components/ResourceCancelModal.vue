<script>
import { RcModal } from '@components/RcModal';

export default {
  emits: ['cancel-cancel', 'confirm-cancel'],

  components: { RcModal },

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

  computed: {
    title() {
      return this.isCancelModal ? this.t('generic.cancel') : this.t('cruResource.backToForm');
    },
  },

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
  <RcModal
    :show="showModal"
    :title="title"
    size="small"
    @close="cancelCancel"
  >
    <p v-if="isCancelModal">
      <t k="cruResource.cancelBody" />
    </p>
    <p v-else>
      <t k="cruResource.backBody" />
    </p>
    <template #actions>
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
        {{ isCancelModal ? t("cruResource.confirmCancel") : t("cruResource.confirmBack") }}
      </button>
    </template>
  </RcModal>
</template>
