<script>
import { mapGetters } from 'vuex';

import AsyncButton from '@/components/AsyncButton';

export default {
  components: { AsyncButton },
  props:      {
    doneRoute: {
      type:     String,
      required: true,
    },

    mode: {
      type:     String,
      default:  'create'
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
      default: false
    },

    confirmBackRequired: {
      type:    Boolean,
      default: true,
    }
  },

  data() {
    return { isCancelModal: false };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

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
    <slot name="cancel">
      <button type="button" class="btn role-secondary" @click="confirmCancelRequired ? checkCancel(true) : $emit('cancel-confirmed')">
        <t k="generic.cancel" />
      </button>
    </slot>
    <slot :checkCancel="checkCancel">
      <AsyncButton :mode="finishButtonMode || mode" @click="$emit('finish', $event)" />
    </slot>

    <modal class="confirm-modal" name="cancel-modal" :width="400" height="auto">
      <div class="header">
        <h4 class="text-default-text">
          <t v-if="isCancelModal" k="generic.cancel" />
          <span v-else>{{ t("cruResource.backToForm") }}</span>
        </h4>
      </div>
      <div class="body">
        <p v-if="isCancelModal">
          <t k="cruResource.cancel" />
        </p>
        <p v-else>
          <t k="cruResource.back" />
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
  justify-content: space-between;
  margin-top: 20px;
}
.confirm-modal {
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
      background-color: #4f3335;
      padding: 15px 0 0 15px;
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
