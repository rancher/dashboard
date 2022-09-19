<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'EmptyDir',
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
    }
  },
  computed: {
    mediumOptions() {
      return [
        { value: '', label: this.t('verrazzano.common.types.emptyDir.medium.notSet') },
        { value: 'Memory', label: this.t('verrazzano.common.types.emptyDir.medium.memory') },
      ];
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <!-- Do not use setFieldIfNotEmpty since the Not Set options sets the value to an empty string -->
      <LabeledSelect
        :value="getField('medium')"
        :mode="mode"
        :options="mediumOptions"
        option-key="value"
        option-label="label"
        :placeholder="getNotSetPlaceholder(value, 'medium')"
        :label="t('verrazzano.common.fields.volumes.emptyDir.medium')"
        @input="setField('medium', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledInput
        :value="getField('sizeLimit')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'sizeLimit')"
        :label="t('verrazzano.common.fields.volumes.emptyDir.sizeLimit')"
        @input="setFieldIfNotEmpty('sizeLimit', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
