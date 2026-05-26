<script lang="ts">
import { RcSection } from '@components/RcSection';
import { Checkbox } from '@components/Form/Checkbox';
import { RadioGroup } from '@components/Form/Radio';
import KeyValue from '@shell/components/form/KeyValue';
import UnitInput from '@shell/components/form/UnitInput';

export default {
  components: {
    RcSection, Checkbox, RadioGroup, KeyValue, UnitInput,
  },

  emits: ['update:tags'],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    disabled: {
      type:    Boolean,
      default: false,
    },
  },
};
</script>

<template>
  <RcSection
    :title="t('capa.machineConfig.advanced.title')"
    :expandable="true"
    mode="with-header"
    type="primary"
  >
    <div>
      <p>{{ t('capa.machineConfig.advanced.cloudInit.title') }}</p>
      <Checkbox
        v-model:value="value.cloudInit.insecureSkipSecretsManager"
        :label="t('capa.machineConfig.advanced.cloudInit.disable.label')"
        class="mt-10"
      />
    </div>

    <RadioGroup
      v-model:value="value.securityGroup"
      name="security-group"
      :options="[
        { label: t('capa.machineConfig.advanced.securityGroup.options.standard'), value: 'merge' },
        { label: t('capa.machineConfig.advanced.securityGroup.options.existing'), value: 'replace' },
      ]"
      label-key="capa.machineConfig.advanced.securityGroup.label"
      class="mt-20 mb-10"
    />

    <RcSection
      :title="t('capa.machineConfig.advanced.marketType.title')"
      :expandable="true"
      mode="with-header"
      type="secondary"
    >
      <p>{{ t('capa.machineConfig.advanced.marketType.description') }}</p>
      <RadioGroup
        v-model:value="value.marketType"
        name="market-type"
        :options="[
          { label: t('capa.machineConfig.advanced.marketType.options.onDemand'), value: 'on-demand' },
          { label: t('capa.machineConfig.advanced.marketType.options.spot'), value: 'spot' },
          { label: t('capa.machineConfig.advanced.marketType.options.block'), value: 'block' },
        ]"
      />
      <div v-if="value.marketType === 'spot'">
        <UnitInput
          v-model:value="value.spotMarketOptions.maxPrice"
          label-key="capa.machineConfig.advanced.marketType.price.label"
          suffix="USD/h"
          class="mb-10"
        />
        <p>{{ t('capa.machineConfig.advanced.marketType.price.description') }}</p>
      </div>
    </RcSection>

    <RcSection
      :title="t('capa.machineConfig.advanced.tags.title')"
      :expandable="true"
      mode="with-header"
      type="secondary"
    >
      <p>{{ t('capa.machineConfig.advanced.tags.description') }}</p>
      <KeyValue
        :mode="mode"
        :read-allowed="false"
        :as-map="true"
        :value="value.additionalTags"
        :add-label="t('capa.machineConfig.advanced.tags.add')"
        data-testid="capa-resource-tags-input"
        @update:value="$emit('update:tags', $event)"
      />
    </RcSection>
  </RcSection>
</template>
