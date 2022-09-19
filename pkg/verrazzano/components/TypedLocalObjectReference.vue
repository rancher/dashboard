<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'TypedLocalObjectReference',
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
        :value="getField('kind')"
        :mode="mode"
        required
        :label="t('verrazzano.common.fields.typedLocalObjectReference.kind')"
        @input="setField('kind', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('name')"
        :mode="mode"
        required
        :label="t('verrazzano.common.fields.typedLocalObjectReference.name')"
        @input="setField('name', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('apiGroup')"
        :mode="mode"
        :label="t('verrazzano.common.fields.typedLocalObjectReference.apiGroup')"
        @input="setField('apiGroup', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
