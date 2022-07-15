<script>
import { _CREATE } from '@shell/config/query-params';

import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: { Banner, LabeledInput }
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
        <LabeledInput
          v-model="value.verificationConfig"
          :mode="mode"
          :label="t('kubewarden.policyServerConfig.verification.label')"
        />
      </div>
    </div>
  </div>
</template>
