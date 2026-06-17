<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret.vue';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

const SYSTEM_DEFAULT_REGISTRY_PULL_SECRETS = 'system-default-registry-pull-secrets';

const props = defineProps<{
  value?: string | null;
  enabled?: boolean;
  mode?: string;
  rules?: Function[];
  checkboxTestId?: string;
  inputTestId?: string;
  pullSecret?: string;
  registerBeforeHook: Function;
}>();

const emit = defineEmits<{
  'update:value': [val: string | null];
  'update:enabled': [val: boolean];
  'update:pullSecret': [val: string | null];
}>();

const store = useStore();

const showInput = ref(!!props.value);
const globalRegistry = ref('');
const defaultPullSecrets = ref<string[]>([]);

onMounted(() => {
  const registrySetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SYSTEM_DEFAULT_REGISTRY);
  const pullSecretsSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SYSTEM_DEFAULT_REGISTRY_PULL_SECRETS);

  globalRegistry.value = registrySetting?.value || registrySetting?.defaultValue;

  // TODO nb first one oooor?
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
 * So a banner listing all secrets is shown instead // TODO nb ?? need ux feedback
 */
const defaultPullSecretLabel = computed(() => {
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
    emit('update:value', null);
    emit('update:pullSecret', null);
  }
});

watch(() => props.value, (neu) => {
  if (!!neu && !showInput.value) {
    showInput.value = true;
  }
});

</script>

<template>
  <Banner
    color="info"
    class="mt-0"
    label-key="cluster.privateRegistry.importedDescription"
  />
  <Checkbox
    v-model:value="showInput"
    class="mb-20"
    :mode="mode"
    :label="t('cluster.privateRegistry.label')"
    :data-testid="checkboxTestId"
  />
  <template v-if="showInput">
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="value"
          :mode="mode"
          :rules="rules"
          :required="!globalRegistry"
          label-key="catalog.chart.registry.custom.inputLabel"
          :data-testid="inputTestId"
          :placeholder="globalRegistry ? 'Default: ' + globalRegistry : t('catalog.chart.registry.custom.placeholder')"
          @update:value="(val) => emit('update:value', val)"
        />
      </div>
    </div>
    <Banner
      v-if="hasMultipleDefaultSecrets"
      color="info"
    >
      Global default image pull secrets have been configured. If an image pull secret is not selected or created here,  the first valid secret from this list will be used:

      <template
        v-for="s in defaultPullSecrets"
        :key="s"
      >
        <code>
          {{ s }}
        </code>
      </template>
    </Banner>
    <!-- //TODO nb hardcode fleet-default ns somewhere -->
    <SelectOrCreateAuthSecret
      :value="pullSecret"
      namespace="fleet-default"
      in-store="management"
      limit-to-namespace
      fixed-image-pull-secret
      :none-label="defaultPullSecretLabel"
      :image-pull-secret-docker-json-url-config="value || globalRegistry"
      :register-before-hook="registerBeforeHook"
      @update:value="(val) => emit('update:pullSecret', val)"
    />
  </template>
</template>

<style lang="scss" scoped>
:deep(.banner__content) {
  display: block;
}
</style>
