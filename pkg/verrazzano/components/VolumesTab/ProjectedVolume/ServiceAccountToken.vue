<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ServiceAccountToken',
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
    },
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledInput
        :value="getField('path')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'path')"
        :label="t('verrazzano.common.fields.volumes.projected.path')"
        @input="setFieldIfNotEmpty('path', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('audience')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'audience')"
        :label="t('verrazzano.common.fields.volumes.projected.audience')"
        @input="setFieldIfNotEmpty('audience', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('expirationSeconds')"
        :mode="mode"
        type="Number"
        min="600"
        :placeholder="getNotSetPlaceholder(value, 'expirationSeconds')"
        :label="t('verrazzano.common.fields.volumes.projected.expirationSeconds')"
        @input="setNumberField('expirationSeconds', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
