<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';

export default {
  name:       'OAMExtendedResource',
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
        :label="t('verrazzano.containerized.fields.extendedResource.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('required')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'required')"
        :label="t('verrazzano.containerized.fields.extendedResource.required')"
        @input="setFieldIfNotEmpty('required', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
