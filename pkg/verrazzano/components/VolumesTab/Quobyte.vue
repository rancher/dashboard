<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'Quobyte',
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
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('registry')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'registry')"
          :label="t('verrazzano.common.fields.volumes.quobyte.registry')"
          @input="setFieldIfNotEmpty('registry', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('volume')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'volume')"
          :label="t('verrazzano.common.fields.volumes.quobyte.volume')"
          @input="setFieldIfNotEmpty('volume', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('tenant')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'tenant')"
          :label="t('verrazzano.common.fields.volumes.quobyte.tenant')"
          @input="setFieldIfNotEmpty('tenant', $event)"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('user')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'user')"
          :label="t('verrazzano.common.fields.volumes.quobyte.user')"
          @input="setFieldIfNotEmpty('user', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('group')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'group')"
          :label="t('verrazzano.common.fields.volumes.quobyte.group')"
          @input="setFieldIfNotEmpty('group', $event)"
        />
      </div>
      <div class="col span-4">
        <Checkbox
          :value="getField('readOnly')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.quobyte.readOnly')"
          @input="setBooleanField('readOnly', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
