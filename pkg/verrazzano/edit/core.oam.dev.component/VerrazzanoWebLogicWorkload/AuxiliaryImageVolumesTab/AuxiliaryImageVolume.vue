<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'AuxiliaryImageVolume',
  components: { LabeledInput },
  mixins:     [WeblogicWorkloadHelper],
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
    <div class="col span-3">
      <LabeledInput
        :value="getField('name')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.weblogic.fields.auxiliaryImageVolume.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('mountPath')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'mountPath')"
        :label="t('verrazzano.weblogic.fields.auxiliaryImageVolume.mountPath')"
        @input="setFieldIfNotEmpty('mountPath', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('sizeLimit')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'sizeLimit')"
        :label="t('verrazzano.weblogic.fields.auxiliaryImageVolume.sizeLimit')"
        @input="setFieldIfNotEmpty('sizeLimit', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :avlue="getField('medium')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'medium')"
        :label="t('verrazzano.weblogic.fields.auxiliaryImageVolume.medium')"
        @input="setFieldIfNotEmpty('medium', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
