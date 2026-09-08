<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';

export default {
  name: 'DisableAuthProviderDialog',

  emits: ['close'],

  components: {
    Banner, Card, Checkbox, RcButton, RcIcon
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
    close() {
      this.$emit('close');
    },

    disable() {
      if (!this.acknowledged) {
        return;
      }

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
      <h3 class="disable-auth-provider__title">
        {{ title }}
      </h3>
    </template>
    <template #body>
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
    </template>
    <template #actions>
      <div class="disable-auth-provider__actions">
        <RcButton
          variant="link"
          size="large"
          class="disable-auth-provider__cancel"
          :data-testid="componentTestid + '-cancel-button'"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <RcButton
          variant="primary"
          size="large"
          class="disable-auth-provider__confirm"
          :disabled="!acknowledged"
          :data-testid="componentTestid + '-confirm-button'"
          @click="disable"
        >
          {{ t('authConfig.disable.confirm') }}
        </RcButton>
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .disable-auth-provider {
    &.card-container {
      box-shadow: none;
      margin: 0;
      padding: 24px;
    }

    :deep(.card-wrap > hr) {
      display: none;
    }

    :deep(.card-body) {
      margin-top: 16px;
      color: var(--body-text);
    }

    :deep(.card-actions) {
      padding-top: 40px;
    }

    &__title {
      margin: 0;
      font-size: 18px;
      line-height: 23px;
      font-weight: 700;
      color: var(--body-text);
    }

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

    &__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      width: 100%;
    }

    &__cancel.rc-button {
      --rc-button-padding: 0 12px;
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
