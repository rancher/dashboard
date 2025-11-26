<script>
import { Card } from '@rc/Card';

export default {
  name: 'PromptRemove',

  emits: ['disable', 'close'],

  components: { Card },
  props:      {
    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'disable-auth-provider'
    },
    disableCb: {
      type:    Function,
      default: () => {}
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    disable() {
      this.disableCb();
      this.$emit('close');
    }
  }
};
</script>

<template>
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
