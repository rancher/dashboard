<script>
import { Card } from '@rc/Card';
import { OIDC_CLIENT_SECRET_ACTION } from '@shell/detail/management.cattle.io.oidcclient.vue';

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
      default: 'oidc-client-secret'
    },
    actionCb: {
      type:    Function,
      default: () => {}
    },
    type: {
      type:    String,
      default: ''
    }
  },
  computed: {
    translationKey() {
      if (this.type === OIDC_CLIENT_SECRET_ACTION.REGEN) {
        return 'regenModal';
      } else if (this.type === OIDC_CLIENT_SECRET_ACTION.REMOVE) {
        return 'deleteModal';
      }

      return '';
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    action() {
      this.actionCb();
      this.$emit('close');
    }
  }
};
</script>

<template>
  <Card
    class="oidc-secret-modal"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t(`oidcclient.${ translationKey }.title`) }}
      </h4>
    </template>
    <template #body>
      <div class="mb-10">
        <p v-clean-html="t(`oidcclient.${ translationKey }.content`)" />
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
        @click="action"
      >
        {{ t(`oidcclient.${ translationKey }.action`) }}
      </button>
    </template>
  </Card>
</template>

<style lang='scss'>
  .oidc-secret-modal {
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
