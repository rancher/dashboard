<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcButton } from '@components/RcButton';
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import { RcIcon } from '@components/RcIcon';

const store = useStore();
const { t } = useI18n(store);

const props = defineProps({
  subtitle: {
    type:    Boolean,
    default: false,
  },
  secretLabel: {
    type:    String,
    default: '',
  },
  showSecretInfo: {
    type:    Boolean,
    default: false,
  },
});
const emit = defineEmits(['edit-credentials']);

const SUSE_ACCESS_TOKENS_URL = 'https://docs.apps.rancher.io/get-started/authentication#create-an-access-token';
</script>

<template>
  <div class="appco-page-header">
    <Masthead
      resource="workload"
      :type-display="t('fleet.appCo.credentials.title')"
      :is-creatable="false"
      :show-favorite="false"
      component-testid="workload-dashboard"
    >
      <template
        v-if="props.subtitle"
        #subHeader
      >
        <p class="mmt-1 text-deemphasized">
          {{ t('fleet.appCo.credentials.infoText') }}<br>
          {{ t('generic.learnMoreAbout') }}
          <a
            :href="SUSE_ACCESS_TOKENS_URL"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('fleet.appCo.credentials.accessTokensLink') }}
            <RcIcon type="external-link" />
          </a>
        </p>
      </template>
      <template #createButton>
        <div class="align-end">
          <div
            v-if="props.showSecretInfo && props.secretLabel"
            class="secret-info"
          >
            <div class="secret-text">
              <span class="secret-label">{{ t('fleet.appCo.credentials.accessTokenLabel') }}</span>
              <span class="secret-value">{{ props.secretLabel }}</span>
            </div>
            <RcButton
              class="edit-btn"
              variant="secondary"
              size="medium"
              :aria-label="t('fleet.appCo.credentials.editCredentials')"
              data-testid="appco-header-edit-credentials"
              @click="emit('edit-credentials')"
            >
              <RcIcon type="edit" />
            </RcButton>
          </div>
        </div>
      </template>
    </Masthead>
  </div>
</template>

<style lang="scss" scoped>
.secret-info {
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px;
  align-items: center;

  .secret-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: right;
  }

  .secret-label {
    color: var(--input-label);
    font-size: 14px;
  }

  .secret-value {
    font-size: 14px;
    line-height: 22px;
  }
}

.edit-btn {
  width: 40px;
}

.align-end {
  display: flex;
  justify-content: flex-end;
}
</style>
