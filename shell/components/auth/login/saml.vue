<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import { useLogin } from '@shell/composables/useLogin';

const KUBECONFIG_RESPONSE_TYPE = 'kubeconfig';

const props = defineProps({
  focusOnMount: {
    type:     Boolean,
    required: true,
  },
  name: {
    type:     String,
    required: true,
  },
  type: {
    type:     String,
    required: true,
  },
});

const route = useRoute();
const store = useStore();
const { t } = useI18n(store);

const btn = ref<InstanceType<typeof RcButton> | null>(null);
const { displayName, focus } = useLogin(props, btn);

const queryParam = (key: string): string => {
  const value = route.query[key];

  return typeof value === 'string' ? value : '';
};

// If any of the CLI params is specified, this is a CLI login
const isCLILogin = computed(() => !!(queryParam('cli') || queryParam('publicKey') || queryParam('responseType') || queryParam('requestId')));

// The CLI asks for `kubeconfig` when no cluster is given and `kubeconfig_<clusterId>`
// when one is, which Rancher splits back apart on the first underscore
const validResponseType = computed(() => {
  const responseType = queryParam('responseType');
  const separator = responseType.indexOf('_');

  if (separator === -1) {
    return responseType === KUBECONFIG_RESPONSE_TYPE;
  }

  return responseType.slice(0, separator) === KUBECONFIG_RESPONSE_TYPE && !!responseType.slice(separator + 1);
});

// If this is a CLI login, we must have the correct response type and the other params must not be empty
const invalidCLILogin = computed(() => isCLILogin.value && (!validResponseType.value || !queryParam('requestId') || !queryParam('publicKey')));

const cliLoginCode = computed(() => queryParam('requestId'));

const warningMessageKey = computed(() => (queryParam('cli') === 'true' ? 'login.cli.warning' : 'login.cli.warningLegacy'));

const login = async() => {
  const { requestId, publicKey, responseType } = route.query;

  const res = await store.dispatch('auth/login', {
    provider: props.name,
    body:     {
      finalRedirectUrl: window.location.origin,
      requestId,
      publicKey,
      responseType
    }
  });

  const { idpRedirectUrl } = res;

  window.location.href = idpRedirectUrl;
};

defineExpose({ focus });
</script>

<template>
  <div class="text-center">
    <div
      v-if="isCLILogin"
      class="cli-login"
    >
      <div class="cli-message">
        {{ t('login.cli.welcome') }}
      </div>
      <div
        v-if="invalidCLILogin"
        class="cli-message cli-error"
      >
        {{ t('login.cli.invalidParams') }}
      </div>
      <template v-else>
        <div class="cli-message">
          {{ t(warningMessageKey, {}, true) }}
        </div>
        <div class="cli-login-code">
          {{ cliLoginCode }}
        </div>
      </template>
    </div>
    <RcButton
      v-if="!invalidCLILogin"
      ref="btn"
      variant="primary"
      size="large"
      data-testid="login-provider-submit"
      @click="login"
    >
      {{ t('login.loginWithProvider', {provider: displayName}) }}
    </RcButton>
  </div>
</template>
<style lang="scss" scoped>
  .cli-login {
    display: flex;
    flex-direction: column;
    align-items: center;

    > div {
      margin-bottom: 8px
    }

    .cli-message {
      font-size: 16px;

      &.cli-error {
        color: var(--error);
      }
    }

    .cli-login-code {
      font-family: 'Courier New', Courier, monospace;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      padding: 4px 8px;
      margin: 8px 0 16px 0;
      letter-spacing: 1px;
      font-size: 16px;
    }
  }
</style>
