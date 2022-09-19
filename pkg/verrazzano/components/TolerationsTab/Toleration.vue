<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'Toleration',
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
    showTolerationSeconds() {
      return this.getField('effect') === 'NoExecute';
    },
    disableValue() {
      return this.getField('operator') === 'Exists';
    },
    effectTypes() {
      return [
        { value: '', label: this.t('verrazzano.common.types.toleration.effect.notSet') },
        { value: 'NoExecute', label: this.t('verrazzano.common.types.toleration.effect.noExecute') },
        { value: 'NoSchedule', label: this.t('verrazzano.common.types.toleration.effect.noSchedule') },
        { value: 'PreferNoSchedule', label: this.t('verrazzano.common.types.toleration.effect.preferNoSchedule') },
      ];
    },
    operatorTypes() {
      return [
        { value: 'Equal', label: this.t('verrazzano.common.types.toleration.operator.equal') },
        { value: 'Exists', label: this.t('verrazzano.common.types.toleration.operator.exists') },
      ];
    }
  },
  watch: {
    operator(neu) {
      if (neu === 'Exists') {
        this.setField('value', '');
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          :value="getField('effect')"
          :mode="mode"
          :options="effectTypes"
          :label="t('verrazzano.common.fields.toleration.effect')"
          @input="setField('effect', $event)"
        />
      </div>
      <div v-if="showTolerationSeconds" class="col span-6">
        <LabeledInput
          :value="getField('tolerationSeconds')"
          :mode="mode"
          type="Number"
          min="0"
          :label="t('verrazzano.common.fields.toleration.tolerationSeconds')"
          @input="setNumberField('tolerationSeconds', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('key')"
          :mode="mode"
          :label="t('verrazzano.common.fields.toleration.key')"
          @input="setField('key', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('operator')"
          :mode="mode"
          :options="operatorTypes"
          :label="t('verrazzano.common.fields.toleration.operator')"
          @input="setField('operator', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('value')"
          :mode="mode"
          :disabled="disableValue"
          :label="t('verrazzano.common.fields.toleration.value')"
          @input="setField('value', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
