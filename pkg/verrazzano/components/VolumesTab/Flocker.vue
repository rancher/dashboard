<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'Flocker',
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
    <div class="col span-6">
      <LabeledInput
        :value="getField('datasetName')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'datasetName')"
        :label="t('verrazzano.common.fields.volumes.flocker.datasetName')"
        @input="setFieldIfNotEmpty('datasetName', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        :value="getField('datasetUUID')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'datasetUUID')"
        :label="t('verrazzano.common.fields.volumes.flocker.datasetUuid')"
        @input="setFieldIfNotEmpty('datasetUUID', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
