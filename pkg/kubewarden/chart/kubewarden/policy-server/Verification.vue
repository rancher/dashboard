<script>
import { _CREATE } from '@shell/config/query-params';

import { Banner } from '@components/Banner';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      default:  null
    },

    configMaps: {
      type:     Array,
      required: true
    }
  },

  components: { Banner, LabeledSelect }
};
</script>

<template>
  <div>
    <div class="row">
      <Banner
        class="type-banner mb-20 mt-0"
        color="info"
        v-html="t('kubewarden.policyServerConfig.verification.description', {}, true)"
      />
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.verificationConfig"
          :mode="mode"
          :label="t('kubewarden.policyServerConfig.verification.label')"
          :options="configMaps"
          option-key="id"
          option-label="id"
          :reduce="opt => opt.metadata.name"
        />
      </div>
    </div>
  </div>
</template>
