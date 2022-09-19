<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'PodDNSConfigOption',
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
    <div class="col span-4">
      <LabeledInput
        :value="getField('name')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.common.fields.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('value')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'value')"
        :label="t('verrazzano.common.fields.value')"
        @input="setFieldIfNotEmpty('value', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
