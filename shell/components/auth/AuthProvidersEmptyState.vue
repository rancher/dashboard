<script setup lang="ts">
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';

const emit = defineEmits<{(e: 'create'): void }>();
</script>

<template>
  <div class="auth-providers-empty">
    <div class="auth-providers-empty__inner">
      <div class="auth-providers-empty__badge">
        <RcIcon
          type="lock"
          size="large"
        />
      </div>
      <h3 class="auth-providers-empty__title">
        {{ t('authConfig.list.empty.title') }}
      </h3>
      <p class="auth-providers-empty__description">
        {{ t('authConfig.list.empty.description') }}
      </p>
      <div class="auth-providers-empty__actions">
        <rc-button
          variant="primary"
          data-testid="auth-config-create"
          @click="emit('create')"
        >
          <template #before>
            <RcIcon
              type="plus"
              size="medium"
            />
          </template>
          {{ t('authConfig.list.empty.create') }}
        </rc-button>
        <a
          :href="t('authConfig.list.docsUrl')"
          target="_blank"
          rel="noopener noreferrer nofollow"
          class="auth-providers-empty__link"
        >
          {{ t('authConfig.list.empty.learnMore') }}
          <RcIcon
            type="external-link"
            size="medium"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-providers-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 40px;

  background-color: var(--body-bg);
  border: 1px dashed var(--border);
  border-radius: var(--border-radius-lg);

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 520px;
  }

  &__badge {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 56px;
    height: 56px;

    background-color: var(--box-bg);
    border-radius: 50%;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    line-height: 27px;
  }

  &__description {
    margin: 0;
    color: var(--label-secondary);
    text-align: center;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
