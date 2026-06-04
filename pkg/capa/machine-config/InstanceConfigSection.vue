<script lang="ts">
import { RcSection } from '@components/RcSection';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { HTTP_TOKENS_VALUES } from './constants';

export default {
  components: {
    RcSection, LabeledSelect, LabeledInput
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    instanceTypeOptions: {
      type:    Array,
      default: () => [],
    },

    subnetOptions: {
      type:    Array,
      default: () => [],
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

  computed: {
    httpTokensOptions() {
      return [
        { label: this.t('capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.options.required'), value: HTTP_TOKENS_VALUES.REQUIRED },
        { label: this.t('capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.options.optional'), value: HTTP_TOKENS_VALUES.OPTIONAL },
      ];
    }
  }
};
</script>

<template>
  <RcSection
    :title="t('capa.machineConfig.instanceConfiguration.title')"
    :expandable="true"
    mode="with-header"
    type="primary"
  >
    <p>{{ t('capa.machineConfig.instanceConfiguration.description') }}</p>

    <LabeledSelect
      v-model:value="value.instanceType"
      :options="instanceTypeOptions"
      label-key="capa.machineConfig.instanceConfiguration.instanceType.label"
      option-key="value"
      option-label="label"
      required
    />
    <LabeledSelect
      v-model:value="value.subnet.id"
      :options="subnetOptions"
      label-key="capa.machineConfig.instanceConfiguration.subnet.label"
      required
    />

    <RcSection
      :title="t('capa.machineConfig.instanceConfiguration.advanced.title')"
      :expandable="true"
      mode="with-header"
      type="secondary"
    >
      <LabeledInput
        v-model:value="value.ami.id"
        label-key="capa.machineConfig.instanceConfiguration.advanced.machineImage.label"
        :placeholder="t('capa.machineConfig.instanceConfiguration.advanced.machineImage.placeholder')"
      />
      <LabeledInput
        v-model:value="value.iamInstanceProfile"
        label-key="capa.machineConfig.instanceConfiguration.advanced.iamInstanceProfileName.label"
      />
      <div>
        <LabeledSelect
          v-model:value="value.instanceMetadataOptions.httpTokens"
          :options="httpTokensOptions"
          label-key="capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.label"
        />
        <p class="text-muted text-small mt-5 mb-0">
          {{ t('capa.machineConfig.instanceConfiguration.advanced.instanceMetadataOptions.httpTokens.description') }}
        </p>
      </div>
    </RcSection>
  </RcSection>
</template>
