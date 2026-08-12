<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { RcSeparator } from '@components/RcSeparator';
import AuthProviderOption from '@shell/components/auth/login/AuthProviderOption.vue';
import type { AuthProviderOption as Option } from '@shell/utils/auth-providers';

const props = defineProps<{
  options: Option[];
  selectedId?: string | null;
}>();

defineEmits<{(e: 'select', option: Option): void }>();

const store = useStore();
const t = (key: string, args?: object) => store.getters['i18n/t'](key, args);

const offered = computed(() => props.options.filter((option) => option.id !== props.selectedId));
const externalOptions = computed(() => offered.value.filter((option) => !option.isLocal));
const localOption = computed(() => offered.value.find((option) => option.isLocal));
</script>

<template>
  <div
    role="group"
    class="auth-provider-list"
    data-testid="login-provider-list"
    :aria-label="t('login.providers.heading')"
  >
    <AuthProviderOption
      v-for="option in externalOptions"
      :key="option.id"
      :option="option"
      @select="$emit('select', $event)"
    />

    <template v-if="localOption">
      <RcSeparator
        v-if="externalOptions.length"
        :decorative="false"
      />
      <AuthProviderOption
        :option="localOption"
        @select="$emit('select', $event)"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
  .auth-provider-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;

    hr {
      margin: 6px 0;
    }
  }
</style>
