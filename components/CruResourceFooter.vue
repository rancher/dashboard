<script>
import { mapGetters } from 'vuex';

import AsyncButton from '@/components/AsyncButton';
import { _VIEW } from '@/config/query-params';

export default {
  components: { AsyncButton },
  props:      {
    doneRoute: {
      type:     String,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    isForm: {
      type:    Boolean,
      default: true,
    },

    // Override the set of labels shown on the button from teh default save/create.
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

      this.$modal.show('cancel-modal');
    },

    confirmCancel(isCancel) {
      this.$modal.hide('cancel-modal');

      this.$emit('cancel-confirmed', isCancel);
    },
  },
};
</script>

<template>
  <div class="cru-resource-footer">
    <slot name="prefix" />
    <slot name="cancel">
      <button
        v-if="!isView"
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
        :mode="finishButtonMode || mode"
        @click="$emit('finish', $event)"
      />
    </slot>

    <modal class="confirm-modal" name="cancel-modal" :width="440" height="auto">
      <div class="header">
        <h4 class="text-default-text">
          <t v-if="isCancelModal" k="generic.cancel" />
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
          @click="$modal.hide('cancel-modal')"
        >
          {{ isForm ? t("cruResource.reviewForm") : t("cruResource.reviewYaml") }}
        </button>
        <button type="button" class="btn role-primary" @click="confirmCancel(isCancelModal)">
          <span v-if="isCancelModal">{{ t("cruResource.confirmCancel") }}</span>
          <span v-else>{{ t("cruResource.confirmBack") }}</span>
        </button>
      </div>
    </modal>
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

      h4 {
        color: white;
      }
    }
    .header,
    .footer {
      height: 50px;
    }
    .footer {
      border-top: 1px solid var(--border);
      text-align: center;
      padding: 10px 0 0 15px;
    }
  }
}
</style>
