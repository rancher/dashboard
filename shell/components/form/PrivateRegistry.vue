<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret.vue';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { PRIVATE_REGISTRY_CONTEXT } from '@shell/components/form/PrivateRegistry.constants';
import type { PrivateRegistryContext } from '@shell/components/form/PrivateRegistry.constants';

const SYSTEM_DEFAULT_REGISTRY_PULL_SECRETS = 'system-default-registry-pull-secrets';

const props = withDefaults(defineProps<{
  value?: string | null;
  enabled?: boolean;
  mode?: string;
  rules?: Function[];
  checkboxTestId?: string;
  inputTestId?: string;
  pullSecret?: string;
  registerBeforeHook?: Function;
  context?: PrivateRegistryContext;
  defaultRegistry?: string;
  namespace?: string;
  inStore?: string;
  showPullSecrets?: boolean;
  noneLabel?: string | null;
  skipPullSecrets?: boolean;
}>(), {
  value:              undefined,
  enabled:            false,
  mode:               'edit',
  rules:              () => [],
  checkboxTestId:     undefined,
  inputTestId:        undefined,
  pullSecret:         undefined,
  registerBeforeHook: undefined,
  context:            PRIVATE_REGISTRY_CONTEXT.PROVISIONING,
  defaultRegistry:    undefined,
  namespace:          'fleet-default',
  inStore:            'management',
  showPullSecrets:    true,
  noneLabel:          undefined,
  skipPullSecrets:    false,
});

const emit = defineEmits<{
  'update:value': [val: string | undefined];
  'update:enabled': [val: boolean];
  'update:pullSecret': [val: string | undefined];
  'update:skipPullSecrets': [val: boolean];
}>();

const store = useStore();

const showInput = ref(!!props.value);
const globalRegistry = ref('');
const defaultPullSecrets = ref<string[]>([]);
const localSkipPullSecrets = ref(props.skipPullSecrets);

const isCharts = computed(() => props.context === PRIVATE_REGISTRY_CONTEXT.CHARTS);
const isImporting = computed(() => props.context === PRIVATE_REGISTRY_CONTEXT.IMPORTING);

const descriptionKey = computed(() => {
  if (isCharts.value) {
    return 'catalog.chart.registry.tooltip';
  }
  if (isImporting.value) {
    return 'cluster.privateRegistry.importedDescription';
  }

  return 'cluster.privateRegistry.description';
});

const checkboxLabelKey = computed(() => {
  if (isCharts.value) {
    return 'catalog.chart.registry.custom.checkBoxLabel';
  }

  return 'cluster.privateRegistry.label';
});

const checkboxTooltipKey = computed(() => {
  if (isCharts.value) {
    return 'catalog.chart.registry.tooltip';
  }

  return undefined;
});

onMounted(() => {
  if (props.defaultRegistry) {
    globalRegistry.value = props.defaultRegistry;
  } else {
    const registrySetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SYSTEM_DEFAULT_REGISTRY);

    globalRegistry.value = registrySetting?.value || registrySetting?.defaultValue;
  }

  const pullSecretsSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SYSTEM_DEFAULT_REGISTRY_PULL_SECRETS);

  if (pullSecretsSetting?.value ) {
    defaultPullSecrets.value = pullSecretsSetting?.value.split(',').map((s: string) => s.trim());
  }
});

const hasMultipleDefaultSecrets = computed(() => {
  return defaultPullSecrets.value?.length > 1;
});

/**
 * If there is exactly one global default pull secret configured, we can show that it is the default in the secret dropdown
 * If there is more than one, UI can't be certain which secret will be used (std users by default can't read arbitrary secrets from local cluster cattle-system)
 * So a banner listing all secrets is shown instead
 */
const defaultPullSecretLabel = computed(() => {
  if (props.noneLabel) {
    return props.noneLabel;
  }
  if (!defaultPullSecrets.value?.length) {
    return null;
  }
  if (defaultPullSecrets.value?.length === 1) {
    return `Use global default pull secret (${ defaultPullSecrets.value[0] })`;
  }

  return 'Use global default pull secret';
});

watch(() => props.enabled, (neu) => {
  if (typeof neu === 'boolean' && neu !== showInput.value) {
    showInput.value = neu;
  }
});

watch(showInput, (neu, old) => {
  if (neu !== props.enabled) {
    emit('update:enabled', neu);
  }
  if (!neu && old && props.value) {
    emit('update:value', undefined);
    emit('update:pullSecret', undefined);
  }
});

watch(() => props.value, (neu) => {
  if (!!neu && !showInput.value) {
    showInput.value = true;
  }
});

watch(() => props.pullSecret, (neu, old) => {
  if (neu && !props.value) {
    emit('update:value', globalRegistry.value);
  }
  if (!neu && old && props.value === globalRegistry.value) {
    emit('update:value', undefined);
  }
});

watch(localSkipPullSecrets, (neu) => {
  emit('update:skipPullSecrets', neu);
  if (neu) {
    emit('update:pullSecret', undefined);
  }
});

watch(() => props.skipPullSecrets, (neu) => {
  if (neu !== localSkipPullSecrets.value) {
    localSkipPullSecrets.value = neu;
  }
});

</script>

<template>
  <Banner
    color="info"
    class="mt-0"
    :label-key="descriptionKey"
  />
  <Checkbox
    v-model:value="showInput"
    class="mb-20"
    :mode="mode"
    :label="t(checkboxLabelKey)"
    :tooltip="checkboxTooltipKey ? t(checkboxTooltipKey) : undefined"
    :data-testid="checkboxTestId"
  />
  <template v-if="showInput">
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="value || globalRegistry"
          :mode="mode"
          :rules="rules"
          :required="!globalRegistry"
          label-key="catalog.chart.registry.custom.inputLabel"
          :data-testid="inputTestId"
          :placeholder="t('catalog.chart.registry.custom.placeholder')"
          @update:value="(val) => emit('update:value', val)"
        />
      </div>
    </div>
    <template v-if="showPullSecrets">
      <Checkbox
        v-if="isCharts"
        v-model:value="localSkipPullSecrets"
        class="mb-10"
        :mode="mode"
        :label="t('catalog.chart.registry.pullSecret.skipOption')"
      />
      <Banner
        v-if="hasMultipleDefaultSecrets && !localSkipPullSecrets"
        color="info"
      >
        <!-- Global default image pull secrets have been configured. If an image pull secret is not selected or created here,  the first valid secret from this list will be used: -->
        <template
          v-for="s in defaultPullSecrets"
          :key="s"
        >
          <code>
            {{ s }}
          </code>
        </template>
        are configured as global default pull secrets. Select or create an image pull secret here to override the global default.
      </Banner>
      <SelectOrCreateAuthSecret
        v-if="!localSkipPullSecrets"
        :value="pullSecret"
        :namespace="namespace"
        :in-store="inStore"
        limit-to-namespace
        fixed-image-pull-secret
        :none-label="defaultPullSecretLabel"
        :image-pull-secret-docker-json-url-config="value || globalRegistry"
        :register-before-hook="registerBeforeHook"
        @update:value="(val) => emit('update:pullSecret', val)"
      />
    </template>
  </template>
</template>

<style lang="scss" scoped>
:deep(.banner__content) {
  display: block;
}
</style>
