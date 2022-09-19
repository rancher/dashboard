<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NFS',
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
    <div class="col span-4">
      <LabeledInput
        :value="getField('server')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'server')"
        :label="t('verrazzano.common.fields.volumes.nfs.server')"
        @input="setFieldIfNotEmpty('server', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('path')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'path')"
        :label="t('verrazzano.common.fields.volumes.nfs.path')"
        @input="setFieldIfNotEmpty('path', $event)"
      />
    </div>
    <div class="col span-4">
      <Checkbox
        :value="getField('readOnly')"
        :mode="mode"
        :label="t('verrazzano.common.fields.volumes.nfs.readOnly')"
        @input="setBooleanField('readOnly', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
