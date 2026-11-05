<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { get, set } from '@shell/utils/object';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _EDIT } from '@shell/config/query-params';
import { useI18n } from '@shell/composables/useI18n';
import { DNS01_PROVIDERS } from '../../form-options';
import { DNS01_PROVIDER_FIELDS, hasFieldDescriptors } from './dns01-providers';

interface Props {
  /** The live `solver.dns01` object. Bound into directly so unrendered keys survive editing. */
  value: Record<string, any>;
  mode?: string;
}

const props = withDefaults(defineProps<Props>(), { mode: _EDIT });

const store = useStore();
const { t } = useI18n(store);

const providerOptions = computed(() => DNS01_PROVIDERS.map((value) => ({ label: t(`certManager.dns01.provider.${ value }`), value })));

/**
 * The provider is whichever key is present on `dns01`. Reading it rather than storing it
 * separately means config written by hand or by an older cert-manager still shows up.
 */
const provider = computed<string | undefined>({
  get() {
    return Object.keys(props.value)[0];
  },
  set(neu) {
    Object.keys(props.value).forEach((key) => delete props.value[key]);

    if (neu) {
      props.value[neu] = {};
    }
  },
});

const fields = computed(() => (provider.value ? DNS01_PROVIDER_FIELDS[provider.value] : undefined) || []);

const isKnownProvider = computed(() => hasFieldDescriptors(provider.value));

const unknownProviderYaml = computed(() => JSON.stringify((provider.value ? props.value[provider.value] : undefined) || {}, null, 2));

function fieldValue(path: string) {
  return get((provider.value ? props.value[provider.value] : undefined) || {}, path);
}

function updateField(path: string, fieldValue: any) {
  // Write into the live provider object so keys this form does not render are preserved.
  set(props.value[provider.value as string], path, fieldValue === '' ? undefined : fieldValue);
}

defineExpose({
  provider, fields, isKnownProvider, unknownProviderYaml, fieldValue, updateField
});
</script>

<template>
  <div>
    <div class="row mmb-5">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="provider"
          :label="t('certManager.dns01.providerLabel')"
          :options="providerOptions"
          :mode="mode"
          :taggable="true"
        />
      </div>
    </div>

    <div
      v-if="isKnownProvider"
      class="row provider-fields"
    >
      <div
        v-for="field in fields"
        :key="field.path"
        class="col span-6"
      >
        <LabeledInput
          :value="fieldValue(field.path)"
          :label="t(field.labelKey)"
          :required="field.required"
          :mode="mode"
          @update:value="v => updateField(field.path, v)"
        />
      </div>
    </div>

    <template v-else-if="provider">
      <Banner
        color="info"
        :label="t('certManager.dns01.unknownProvider', { provider })"
      />
      <pre class="dns01-raw">{{ unknownProviderYaml }}</pre>
    </template>
  </div>
</template>

<style lang="scss" scoped>
/**
 * `.row` never wraps, so the providers that carry more than two fields - most of them, Azure DNS
 * has seven - push the page sideways. The column widths already add up to exactly two per row
 * plus one gutter, so wrapping is all that is missing; the gutter on every second column has to
 * go with it, since only the last child drops it by default.
 */
.provider-fields {
  flex-wrap: wrap;
  row-gap: var(--gap);

  .col:nth-child(even) {
    margin-right: 0;
  }
}

.dns01-raw {
  max-height: 240px;
  overflow: auto;
}
</style>
