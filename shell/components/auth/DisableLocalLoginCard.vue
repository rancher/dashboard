<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { Banner } from '@components/Banner';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

const props = defineProps<{
  value: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{(e: 'update:value', value: boolean): void }>();

const switchKey = ref(0);

const onToggle = async(next: boolean) => {
  if (props.disabled) {
    return;
  }

  emit('update:value', next);

  await nextTick();

  if (props.value !== next) {
    switchKey.value++;
  }
};
</script>

<template>
  <div class="disable-local-login">
    <div class="disable-local-login__row">
      <toggle-switch
        :key="switchKey"
        :value="value"
        :disabled="disabled"
        :on-label="t('authConfig.list.disableLocal.label')"
        class="disable-local-login__switch"
        data-testid="auth-config-disable-local"
        @update:value="onToggle"
      />
      <div class="disable-local-login__copy">
        <span class="disable-local-login__title">
          {{ t('authConfig.list.disableLocal.label') }}
        </span>
        <span class="disable-local-login__description">
          {{ t('authConfig.list.disableLocal.description') }}
        </span>
      </div>
    </div>

    <Banner
      v-if="value"
      color="error"
      class="disable-local-login__risk"
      data-testid="auth-config-disable-local-risk"
      :label="t('authConfig.list.disableLocal.risk')"
    />
  </div>
</template>

<style lang="scss" scoped>
.disable-local-login {
  padding: 16px 20px;

  background-color: var(--body-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-lg);

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  &__switch {
    // Centers the switch against the title's line box rather than the whole column
    height: 21px;
    flex-shrink: 0;

    // The label is rendered alongside the description below instead, but it stays
    // on the input as its accessible name
    :deep(.label) {
      display: none;
    }
  }

  &__copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
  }

  &__description {
    color: var(--label-secondary);
    font-size: 13px;
    line-height: 20px;
  }

  &__risk {
    margin: 16px 0 0 0;
  }
}
</style>
