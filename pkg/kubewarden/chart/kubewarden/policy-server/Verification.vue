<script>
import { _CREATE } from '@shell/config/query-params';

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

  components: { LabeledInput }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.verificationConfig"
          :mode="mode"
          :label="t('kubewarden.policyServerConfig.verification.label')"
          :tooltip="t('kubewarden.policyServerConfig.verification.tooltip')"
        />
      </div>
    </div>
  </div>
</template>
