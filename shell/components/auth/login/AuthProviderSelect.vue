<script setup lang="ts">
import { useStore } from 'vuex';
import { computed } from 'vue';
import {
  RcDropdown,
  RcDropdownGroup,
  RcDropdownItemCheckbox,
  RcDropdownSeparator,
  RcDropdownTrigger,
} from '@components/RcDropdown';
import { RcIcon } from '@components/RcIcon';
import AuthProviderOption from '@shell/components/auth/login/AuthProviderOption.vue';
import type { AuthProviderOption as Option } from '@shell/utils/auth-providers';

const props = defineProps<{
  options: Option[];
  remember: boolean;
}>();

defineEmits<{(e: 'select', option: Option): void;
  (e: 'update:remember', remember: boolean): void;
}>();

const store = useStore();
const t = (key: string, args?: object) => store.getters['i18n/t'](key, args);

const externalOptions = computed(() => props.options.filter((option) => !option.isLocal));
const localOption = computed(() => props.options.find((option) => option.isLocal));
</script>

<template>
  <RcDropdown
    class="auth-provider-select"
    placement="bottom-start"
    :aria-label="t('login.providers.menu')"
  >
    <RcDropdownTrigger
      variant="secondary"
      size="large"
      data-testid="login-provider-trigger"
    >
      {{ t('login.providers.choose') }}
      <template #after>
        <RcIcon type="chevron-down" />
      </template>
    </RcDropdownTrigger>

    <template #dropdownCollection>
      <div class="auth-provider-select__menu">
        <RcDropdownGroup :label="t('login.providers.heading')">
          <AuthProviderOption
            v-for="option in externalOptions"
            :key="option.id"
            :option="option"
            @select="$emit('select', $event)"
          />
        </RcDropdownGroup>

        <template v-if="localOption">
          <RcDropdownSeparator />
          <AuthProviderOption
            :option="localOption"
            @select="$emit('select', $event)"
          />
        </template>

        <RcDropdownSeparator />
        <RcDropdownItemCheckbox
          :model-value="remember"
          data-testid="login-provider-remember"
          @click="$emit('update:remember', $event)"
        >
          {{ t('login.providers.remember') }}
        </RcDropdownItemCheckbox>
      </div>
    </template>
  </RcDropdown>
</template>

<style lang="scss" scoped>
  .auth-provider-select {
    display: inline-block;

    &__menu {
      width: 362px;
      max-width: 100%;
      text-align: left;
    }
  }
</style>
