<script>
import { mapGetters } from 'vuex';

import AsyncButton from '@shell/components/AsyncButton';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: { AsyncButton, ResourceCancelModal },
  props:      {
    mode: {
      type:    String,
      default: 'create',
    },

    isForm: {
      type:    Boolean,
      default: true,
    },

    // Override the set of labels shown on the button from the default save/create.
    finishButtonMode: {
      type:    String,
      default: null,
    },

    confirmCancelRequired: {
      type:    Boolean,
      default: false,
    },

    confirmBackRequired: {
      type:    Boolean,
      default: true,
    },

    showCancel: {
      type:    Boolean,
      default: true
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'form-footer'
    }
  },

  data() {
    return { isCancelModal: false };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    checkCancel(isCancel) {
      if (isCancel) {
        this.isCancelModal = true;
      } else {
        this.isCancelModal = false;
      }
      this.$refs.cancelModal.show();
    },

    confirmCancel(isCancel) {
      this.$emit('cancel-confirmed', isCancel);
    },
  },
};
</script>

<template>
  <div class="cru-resource-footer">
    <slot name="footer-prefix" />
    <slot name="cancel">
      <button
        v-if="!isView && showCancel"
        id="cru-cancel"
        :data-testid="componentTestid + '-cancel'"
        type="button"
        class="btn role-secondary"
        @click="confirmCancelRequired ? checkCancel(true) : $emit('cancel-confirmed', true)"
      >
        <t k="generic.cancel" />
      </button>
    </slot>
    <slot :checkCancel="checkCancel">
      <AsyncButton
        v-if="!isView"
        :data-testid="componentTestid + '-create'"
        :mode="finishButtonMode || mode"
        @click="$emit('finish', $event)"
      />
    </slot>
    <ResourceCancelModal
      ref="cancelModal"
      :is-cancel-modal="isCancelModal"
      :is-form="isForm"
      @confirm-cancel="confirmCancel($event)"
    />
  </div>
</template>

<style lang="scss">
.cru-resource-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;

  .btn {
    margin-left: 20px;
  }
}

</style>
