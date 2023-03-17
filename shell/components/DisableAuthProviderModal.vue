<script>
import { Card } from '@components/Card';
export default {
  name:       'PromptRemove',
  components: { Card },
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
  methods: {
    show() {
      this.$modal.show('disableAuthProviderModal');
    },
    close() {
      this.$modal.hide('disableAuthProviderModal');
    },
    disable() {
      this.$modal.hide('disableAuthProviderModal');
      this.$emit('disable');
    },
  }
};
</script>

<template>
  <modal
    class="remove-modal"
    name="disableAuthProviderModal"
    :width="400"
    height="auto"
    styles="max-height: 100vh;"
    @closed="close"
  >
    <Card
      class="disable-auth-provider"
      :show-highlight-border="false"
    >
      <h4
        slot="title"
        class="text-default-text"
      >
        {{ t('promptRemove.title') }}
      </h4>
      <div slot="body">
        <div class="mb-10">
          <p v-clean-html="t('promptRemove.attemptingToRemoveAuthConfig', null, true)" />
        </div>
      </div>
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
  </modal>
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
