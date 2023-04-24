<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import OamComponentHelper from '@pkg/mixins/oam-component-helper';

export default {
  name:       'ServicePort',
  components: {
    LabeledInput,
    LabeledSelect,
  },
  mixins: [OamComponentHelper],
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
          :value="getField('name')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'name')"
          :label="t('verrazzano.common.fields.portName')"
          @input="setFieldIfNotEmpty('name', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('appProtocol')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'appProtocol')"
          :label="t('verrazzano.common.fields.appProtocol')"
          @input="setFieldIfNotEmpty('appProtocol', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('protocol')"
          :mode="mode"
          :options="protocolOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'protocol')"
          :label="t('verrazzano.common.fields.protocol')"
          @input="setFieldIfNotEmpty('protocol', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('port')"
          :mode="mode"
          type="Number"
          :min="minPortNumber"
          :max="maxPortNumber"
          :placeholder="getNotSetPlaceholder(value, 'port')"
          :label="t('verrazzano.common.fields.port')"
          @input="setNumberField('port', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('nodePort')"
          :mode="mode"
          type="Number"
          :min="minPortNumber"
          :max="maxPortNumber"
          :placeholder="getNotSetPlaceholder(value, 'nodePort')"
          :label="t('verrazzano.common.fields.nodePort')"
          @input="setNumberField('nodePort', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('targetPort')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'targetPort')"
          :label="t('verrazzano.common.fields.targetPort')"
          @input="setFieldIfNotEmpty('targetPort', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
