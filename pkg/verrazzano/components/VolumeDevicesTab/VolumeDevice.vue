<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'VolumeDevice',
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
        :value="getField('name')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.common.fields.volumeDevice.name')"
        @input="setField('name', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        :value="getField('devicePath')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'devicePath')"
        :label="t('verrazzano.common.fields.volumeDevice.devicePath')"
        @input="setField('devicePath', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
