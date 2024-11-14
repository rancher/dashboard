<script>

import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _EDIT } from '@shell/config/query-params';

export default {
  components: { LabeledInput, LabeledSelect },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
  },
  data() {
    return { portOptions: ['TCP', 'UDP'] };
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledInput
        v-model:value.number="value.port"
        :mode="mode"
        type="number"
        min="1"
        max="65535"
        :placeholder="t('networkpolicy.rules.ports.port.placeholder')"
        :label="t('networkpolicy.rules.ports.port.label')"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        v-model:value="value.protocol"
        :mode="mode"
        :options="portOptions"
        :multiple="false"
        :label="t('networkpolicy.rules.ports.protocol')"
      />
    </div>
  </div>
</template>
