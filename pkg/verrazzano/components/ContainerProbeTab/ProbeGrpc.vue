<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ProbeGrpc',
  components: { LabeledInput },
  mixins:     [VerrazzanoHelper],
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput
        :value="getField('port')"
        :mode="mode"
        type="Number"
        min="1"
        required
        :label="t('verrazzano.common.fields.probeGrpc.port')"
        @input="setNumberField('port', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        :value="getField('service')"
        :mode="mode"
        :label="t('verrazzano.common.fields.probeGrpc.service')"
        @input="setField('service', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
