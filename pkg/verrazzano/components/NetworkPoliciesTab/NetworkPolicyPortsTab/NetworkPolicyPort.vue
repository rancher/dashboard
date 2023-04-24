<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NetworkPolicyPort',
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
  computed: {
    disableEndPort() {
      let result = true;
      const port = this.getField('port');

      if (port && !isNaN(parseInt(port))) {
        result = false;
      }

      return result;
    }
  },
  methods: {
    setPort(value) {
      this.setFieldIfNotEmpty('port', value);
      if (this.disableEndPort) {
        this.setField('endPort', undefined);
      }
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
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
    <div class="col span-4">
      <LabeledInput
        :value="getField('port')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'port')"
        :label="t('verrazzano.common.fields.port')"
        @input="setPort($event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('endPort')"
        :mode="mode"
        type="Number"
        :min="minPortNumber"
        :max="maxPortNumber"
        :disabled="disableEndPort"
        :placeholder="getNotSetPlaceholder(value, 'endPort')"
        :label="t('verrazzano.common.fields.endPort')"
        @input="setFieldIfNotEmpty('endPort', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
