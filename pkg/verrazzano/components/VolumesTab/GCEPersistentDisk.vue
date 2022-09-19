<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'GCEPersistentDisk',
  components: {
    Checkbox,
    LabeledInput,
  },
  mixins: [VerrazzanoHelper],
  props:  {
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
        :value="getField('pdName')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'pdName')"
        :label="t('verrazzano.common.fields.volumes.gce.pdName')"
        @input="setFieldIfNotEmpty('pdName', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('fsType')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'fsType')"
        :label="t('verrazzano.common.fields.volumes.gce.fsType')"
        @input="setFieldIfNotEmpty('fsType', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('partition')"
        :mode="mode"
        type="Number"
        min="0"
        :placeholder="getNotSetPlaceholder(value, 'partition')"
        :label="t('verrazzano.common.fields.volumes.gce.partition')"
        @input="setNumberField('partition', $event)"
      />
    </div>
    <div class="col span-3">
      <Checkbox
        :value="getField('readOnly')"
        :mode="mode"
        :label="t('verrazzano.common.fields.volumes.gce.readOnly')"
        @input="setBooleanField('readOnly', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
