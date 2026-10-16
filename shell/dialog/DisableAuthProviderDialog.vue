<script>
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';
import { RcModal } from '@components/RcModal';

export default {
  name: 'DisableAuthProviderDialog',

  components: {
    Banner, Checkbox, RcButton, RcIcon, RcModal
  },

  props: {
    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'disable-auth-provider'
    },

    /**
     * `show` and the `close` handler, from whoever owns this dialog's visibility
     */
    modal: {
      type:     Object,
      required: true
    },

    name: {
      type:    String,
      default: ''
    },

    disableCb: {
      type:    Function,
      default: () => {}
    }
  },

  data() {
    return { acknowledged: false };
  },

  computed: {
    title() {
      return this.name ? this.t('authConfig.disable.title', { name: this.name }) : this.t('authConfig.disable.titleGeneric');
    }
  },

  methods: {
    disable(close) {
      if (!this.acknowledged) {
        return;
      }

      this.disableCb();
      close();
    }
  }
};
</script>

<template>
  <RcModal
    v-bind="modal"
    :title="title"
  >
    <div class="disable-auth-provider__body">
      <p class="disable-auth-provider__aftermath">
        {{ t('authConfig.disable.loggedOut') }}
      </p>

      <a
        :href="t('authConfig.disable.docsUrl')"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="disable-auth-provider__link"
      >
        {{ t('authConfig.disable.learnMore') }}
        <RcIcon
          type="external-link"
          size="medium"
        />
      </a>

      <Banner
        color="error"
        class="disable-auth-provider__warning"
      >
        <p>{{ t('authConfig.disable.irreversible') }}</p>
        <Checkbox
          v-model:value="acknowledged"
          :label="t('authConfig.disable.acknowledge')"
          :data-testid="componentTestid + '-acknowledge'"
        />
      </Banner>
    </div>

    <template #primary-action="{ close }">
      <RcButton
        variant="primary"
        size="large"
        class="disable-auth-provider__confirm"
        :disabled="!acknowledged"
        :data-testid="componentTestid + '-confirm-button'"
        @click="disable(close)"
      >
        {{ t('authConfig.disable.confirm') }}
      </RcButton>
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
  .disable-auth-provider {
    &__body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    &__aftermath {
      margin: 0;
      line-height: 22px;
      color: var(--label-secondary);
    }

    &__link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    &__warning {
      width: 100%;
      margin: 0;

      :deep(.banner__content) {
        display: flex;
        flex-direction: column;
        gap: 10px;

        p {
          margin: 0;
        }
      }
    }

    &__confirm.rc-button {
      background-color: var(--error);
      color: var(--error-text);

      &:hover:not(:disabled) {
        background-color: var(--error-hover-bg);
        color: var(--error-hover-text);
      }
    }
  }
</style>
