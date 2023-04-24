<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';

export default {
  name:       'OAMEnvironmentVariable',
  components: { LabeledInput },
  mixins:     [ContainerizedWorkloadHelper],
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create',
    },
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
        :label="t('verrazzano.common.fields.envVar.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('value')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'value')"
        :label="t('verrazzano.common.fields.envVar.value')"
        @input="setFieldIfNotEmpty('value', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
