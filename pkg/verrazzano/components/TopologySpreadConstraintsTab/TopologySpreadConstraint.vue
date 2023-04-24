<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import PodAffinityTerm from '@pkg/components/PodAffinityTerm';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'TopologySpreadConstraint',
  components: {
    LabeledInput,
    LabeledSelect,
    PodAffinityTerm,
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
    whenUnsatisfiableOptions() {
      return [
        { value: 'DoNotSchedule', label: this.t('verrazzano.common.types.whenUnsatisfiable.doNotSchedule') },
        { value: 'ScheduleAnyway', label: this.t('verrazzano.common.types.whenUnsatisfiable.scheduleAnyway') },
      ];
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('topologyKey')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'topologyKey')"
          :label="t('verrazzano.common.fields.topologyKey')"
          @input="setFieldIfNotEmpty('topologyKey', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('whenUnsatisfiable')"
          :mode="mode"
          required
          :options="whenUnsatisfiableOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'whenUnsatisfiable')"
          :label="t('verrazzano.common.fields.whenUnsatisfiable')"
          @input="setFieldIfNotEmpty('whenUnsatisfiable', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('maxSkew')"
          :mode="mode"
          required
          type="Number"
          min="1"
          :placeholder="getNotSetPlaceholder(value, 'maxSkew')"
          :label="t('verrazzano.common.fields.maxSkew')"
          @input="setNumberField('maxSkew', $event)"
        />
      </div>
    </div>
    <div class="spacer" />
    <div>
      <h3>{{ t('verrazzano.common.titles.labelSelector') }}</h3>
      <PodAffinityTerm
        :value="getField('labelSelector')"
        :mode="mode"
        @input="setFieldIfNotEmpty('labelSelector', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
