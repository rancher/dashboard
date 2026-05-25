<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcButton } from '@components/RcButton';

const store = useStore();
const { t } = useI18n(store);

const props = defineProps({
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
</script>

<template>
  <div class="appco-page-header">
    <div class="title-row">
      <h1>{{ t('fleet.appCo.credentials.title') }}</h1>
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
          data-testid="appco-header-edit-credentials"
          @click="emit('edit-credentials')"
        >
          <i class="icon icon-edit" />
        </RcButton>
      </div>
    </div>
    <hr class="title-divider">
  </div>
</template>

<style lang="scss" scoped>
.appco-page-header {
  h1 {
    margin-bottom: 0;
  }
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
}

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
  .icon {
    font-size: 14px;
  }
}

.title-divider {
  margin: 15px 0 20px;
  border: none;
  border-top: 1px solid var(--border);
}
</style>
