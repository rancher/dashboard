<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
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

const list = ref<HTMLElement | null>(null);
const scrollRegion = ref<HTMLElement | null>(null);
const scrollbarWidth = ref(0);

const measureScrollbar = () => {
  const el = scrollRegion.value;

  scrollbarWidth.value = el ? el.offsetWidth - el.clientWidth : 0;
};

const remeasure = () => nextTick(measureScrollbar);

onMounted(() => {
  measureScrollbar();
  window.addEventListener('resize', remeasure);
});

onBeforeUnmount(() => window.removeEventListener('resize', remeasure));

watch(externalOptions, remeasure);

/** Lets the page hand focus over when the list is revealed. */
const focus = () => list.value?.querySelector('button')?.focus();

defineExpose({ focus });
</script>

<template>
  <div
    ref="list"
    role="group"
    class="auth-provider-list"
    data-testid="login-provider-list"
    :aria-label="t('login.providers.heading')"
  >
    <div
      v-if="externalOptions.length"
      ref="scrollRegion"
      class="auth-provider-list__scroll"
      data-testid="login-provider-scroll"
    >
      <AuthProviderOption
        v-for="option in externalOptions"
        :key="option.id"
        :option="option"
        @select="$emit('select', $event)"
      />
    </div>

    <!-- Local stays out of the scrolling region so that it is always in reach. -->
    <div
      v-if="localOption"
      class="auth-provider-list__local"
      :style="{ paddingRight: `${ scrollbarWidth }px` }"
    >
      <RcSeparator
        v-if="externalOptions.length"
        :decorative="false"
      />
      <AuthProviderOption
        :option="localOption"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .auth-provider-list {
    --auth-provider-row-pitch: 90px;

    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 0 2px;

    > * {
      flex: 0 0 auto;
    }

    &__scroll {
      display: flex;
      flex-direction: column;
      gap: 2px;

      max-height: min(calc(var(--auth-provider-row-pitch) * 4), 42vh);
      overflow-y: auto;

      margin: 0 -2px;
      padding: 2px;

      > * {
        flex: 0 0 auto;
      }
    }

    &__local {
      display: flex;
      flex-direction: column;
    }

    hr {
      margin: 10px 0;
    }
  }
</style>
