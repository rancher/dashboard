<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ContainerPort',
  components: {
    LabeledInput,
    LabeledSelect,
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
      <div class="col span-2">
        <LabeledSelect
          :value="getField('protocol')"
          :mode="mode"
          :options="protocolOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'protocol')"
          :label="t('verrazzano.common.fields.container.ports.protocol')"
          @input="setFieldIfNotEmpty('protocol', $event)"
        />
      </div>
      <div class="col span-2">
        <LabeledInput
          :value="getField('containerPort')"
          :mode="mode"
          required
          type="Number"
          :min="minPortNumber"
          :max="maxPortNumber"
          :placeholder="getNotSetPlaceholder(value, 'containerPort')"
          :label="t('verrazzano.common.fields.container.ports.containerPort')"
          @input="setNumberField('containerPort', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="getField('name')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'name')"
          :label="t('verrazzano.common.fields.container.ports.name')"
          @input="setFieldIfNotEmpty('name', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="getField('hostIP')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'hostIP')"
          :label="t('verrazzano.common.fields.container.ports.hostIP')"
          @input="setFieldIfNotEmpty('hostIP', $event)"
        />
      </div>
      <div class="col span-2">
        <LabeledInput
          :value="getField('hostPort')"
          :mode="mode"
          type="Number"
          :min="minPortNumber"
          :max="maxPortNumber"
          :placeholder="getNotSetPlaceholder(value, 'hostPort')"
          :label="t('verrazzano.common.fields.container.ports.hostPort')"
          @input="setNumberField('hostPort', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
