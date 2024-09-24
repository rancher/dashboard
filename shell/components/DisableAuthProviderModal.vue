<script>
import { Card } from '@components/Card';
import AppModal from '@shell/components/AppModal.vue';

export default {
  name: 'PromptRemove',

  emits: ['disable'],

  components: { Card, AppModal },
  props:      {
    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'disable-auth-provider'
    }
  },
  data() {
    return { showModal: false };
  },
  methods: {
    show() {
      this.showModal = true;
    },
    close() {
      this.showModal = false;
    },
    disable() {
      this.showModal = false;
      this.$emit('disable');
    },
  }
};
</script>

<template>
  <app-modal
    v-if="showModal"
    custom-class="remove-modal"
    name="disableAuthProviderModal"
    :width="400"
    height="auto"
    styles="max-height: 100vh;"
    @close="close"
  >
    <Card
      class="disable-auth-provider"
      :show-highlight-border="false"
    >
      <template #title>
        <h4 class="text-default-text">
          {{ t('promptRemove.title') }}
        </h4>
      </template>
      <template #body>
        <div class="mb-10">
          <p v-clean-html="t('promptRemove.attemptingToRemoveAuthConfig', null, true)" />
        </div>
      </template>
      <template #actions>
        <button
          class="btn role-secondary"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <div class="spacer" />
        <button
          class="btn role-primary bg-error ml-10"
          :data-testid="componentTestid + '-confirm-button'"
          @click="disable"
        >
          {{ t('generic.disable') }}
        </button>
      </template>
    </Card>
  </app-modal>
</template>

<style lang='scss'>
  .disable-auth-provider {
    &.card-container {
      box-shadow: none;
    }
    #confirm {
      width: 90%;
      margin-left: 3px;
    }

    .remove-modal {
        border-radius: var(--border-radius);
        overflow: scroll;
        max-height: 100vh;
        & ::-webkit-scrollbar-corner {
          background: rgba(0,0,0,0);
        }
    }

    .actions {
      text-align: right;
    }

    .card-actions {
      display: flex;

      .spacer {
        flex: 1;
      }
    }
  }
</style>
