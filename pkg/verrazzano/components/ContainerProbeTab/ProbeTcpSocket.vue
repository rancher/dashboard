<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ProbeTcpSocket',
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
        :value="getField('host')"
        :mode="mode"
        :label="t('verrazzano.common.fields.probeTcpSocket.host')"
        @input="setField('host', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        :value="getField('port')"
        :mode="mode"
        required
        :label="t('verrazzano.common.fields.probeTcpSocket.port')"
        @input="setField('port', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
