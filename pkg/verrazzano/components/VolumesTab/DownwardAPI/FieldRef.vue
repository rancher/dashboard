<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'FieldRef',
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
        :value="getField('fieldPath')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'fieldPath')"
        :label="t('verrazzano.common.fields.volumes.downwardApi.fieldPath')"
        @input="setFieldIfNotEmpty('fieldPath', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        :value="getField('apiVersion')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'apiVersion')"
        :label="t('verrazzano.common.fields.volumes.downwardApi.apiVersion')"
        @input="setFieldIfNotEmpty('apiVersion', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
