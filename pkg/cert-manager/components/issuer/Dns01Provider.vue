<script>
import { get, set } from '@shell/utils/object';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { DNS01_PROVIDERS } from '../../form-options';
import { DNS01_PROVIDER_FIELDS, hasFieldDescriptors } from './dns01-providers';

export default {
  name:       'Dns01Provider',
  components: {
    Banner, LabeledInput, LabeledSelect
  },

  props: {
    /** The live `solver.dns01` object. Bound into directly so unrendered keys survive editing. */
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
  },

  computed: {
    providerOptions() {
      return DNS01_PROVIDERS.map((value) => ({ label: this.t(`certManager.dns01.provider.${ value }`), value }));
    },

    /**
     * The provider is whichever key is present on `dns01`. Reading it rather than storing it
     * separately means config written by hand or by an older cert-manager still shows up.
     */
    provider: {
      get() {
        return Object.keys(this.value)[0];
      },
      set(neu) {
        Object.keys(this.value).forEach((key) => delete this.value[key]);

        if (neu) {
          this.value[neu] = {};
        }
      },
    },

    fields() {
      return DNS01_PROVIDER_FIELDS[this.provider] || [];
    },

    isKnownProvider() {
      return hasFieldDescriptors(this.provider);
    },

    isView() {
      return this.mode === _VIEW;
    },

    unknownProviderYaml() {
      return JSON.stringify(this.value[this.provider] || {}, null, 2);
    },
  },

  methods: {
    fieldValue(path) {
      return get(this.value[this.provider] || {}, path);
    },

    updateField(path, fieldValue) {
      // Write into the live provider object so keys this form does not render are preserved.
      set(this.value[this.provider], path, fieldValue === '' ? undefined : fieldValue);
    },
  },
};
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
