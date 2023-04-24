<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ResourceFieldRef',
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
    resourceOptions() {
      return [
        { value: 'limits.cpu', label: this.t('verrazzano.common.types.downwardApi.cpuLimits') },
        { value: 'limits.memory', label: this.t('verrazzano.common.types.downwardApi.memoryLimits') },
        { value: 'requests.cpu', label: this.t('verrazzano.common.types.downwardApi.cpuRequests') },
        { value: 'requests.memory', label: this.t('verrazzano.common.types.downwardApi.memoryRequests') },
      ];
    },
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledInput
        :value="getField('containerName')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'containerName')"
        :label="t('verrazzano.common.fields.volumes.downwardApi.containerName')"
        @input="setFieldIfNotEmpty('containerName', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('divisor')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'divisor')"
        :label="t('verrazzano.common.fields.volumes.downwardApi.divisor')"
        @input="setFieldIfNotEmpty('divisor', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        :value="getField('resource')"
        :mode="mode"
        :options="resourceOptions"
        option-key="value"
        option-label="label"
        :placeholder="getNotSetPlaceholder(value, 'resource')"
        :label="t('verrazzano.common.fields.volumes.downwardApi.resource')"
        @input="setFieldIfNotEmpty('resource', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
