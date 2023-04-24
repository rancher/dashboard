<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name:       'OAMPort',
  components: {
    LabeledInput,
    LabeledSelect,
  },
  mixins: [ContainerizedWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create',
    },
  },
  computed: {
    protocolOptions() {
      return [
        { value: 'TCP', label: this.t('verrazzano.containerized.types.protocol.tcp') },
        { value: 'UDP', label: this.t('verrazzano.containerized.types.protocol.udp') },
      ];
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledInput
        :value="getField('name')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.containerized.fields.portName')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('containerPort')"
        :mode="mode"
        type="Number"
        :min="minPortNumber"
        :max="maxPortNumber"
        required
        :placeholder="getNotSetPlaceholder(value, 'containerPort')"
        :label="t('verrazzano.containerized.fields.containerPort')"
        @input="setNumberField('containerPort', $event)"
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
        :label="t('verrazzano.containerized.fields.protocol')"
        @input="setFieldIfNotEmpty('protocol', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
