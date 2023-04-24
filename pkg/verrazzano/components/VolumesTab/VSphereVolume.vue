<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'VSphereVolume',
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
    <div class="col span-3">
      <LabeledInput
        :value="getField('volumePath')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'volumePath')"
        :label="t('verrazzano.common.fields.volumes.vsphere.volumePath')"
        @input="setFieldIfNotEmpty('volumePath', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('storagePolicyID')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'storagePolicyID')"
        :label="t('verrazzano.common.fields.volumes.vsphere.storagePolicyID')"
        @input="setFieldIfNotEmpty('storagePolicyID', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('storagePolicyName')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'storagePolicyName')"
        :label="t('verrazzano.common.fields.volumes.vsphere.storagePolicyName')"
        @input="setFieldIfNotEmpty('storagePolicyName', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('fsType')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'fsType')"
        :label="t('verrazzano.common.fields.volumes.vsphere.fsType')"
        @input="setFieldIfNotEmpty('fsType', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
