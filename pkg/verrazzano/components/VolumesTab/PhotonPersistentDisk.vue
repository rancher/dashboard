<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'PhotonPersistentDisk',
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
        :value="getField('pdID')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'pdID')"
        :label="t('verrazzano.common.fields.volumes.photon.pdId')"
        @input="setFieldIfNotEmpty('pdID', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        :value="getField('fsType')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'fsType')"
        :label="t('verrazzano.common.fields.volumes.photon.fsType')"
        @input="setFieldIfNotEmpty('fsType', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
