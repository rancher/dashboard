<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'SeccompProfile',
  components: {
    LabeledInput,
    LabeledSelect
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:     Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },
  computed: {
    typeOptions() {
      return [
        {
          value: 'Localhost',
          label: this.t('verrazzano.common.types.seccompProfileType.localhost')
        },
        {
          value: 'RuntimeDefault',
          label: this.t('verrazzano.common.types.seccompProfileType.runtimeDefault')
        },
        {
          value: 'Unconfined',
          label: this.t('verrazzano.common.types.seccompProfileType.unconfined')
        },
      ];
    },
    showLocalhost() {
      return this.value.type === 'Localhost';
    }
  },
  watch: {
    'value.type'(newType, oldType) {
      if (oldType === 'Localhost' && newType !== 'Localhost') {
        this.setField('localhostProfile', undefined);
      }
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          :value="getField('type')"
          :mode="mode"
          :label="t('verrazzano.common.fields.seccompProfile.type')"
          :options="typeOptions"
          option-key="value"
          option-label="label"
          @input="setField('type', $event)"
        />
      </div>
      <div v-if="showLocalhost" class="col span-6">
        <LabeledInput
          :value="getField('localhostProfile')"
          :mode="mode"
          :label="t('verrazzano.common.fields.seccompProfile.localhostProfile')"
          @input="setField('localhostProfile', $event)"
        />
      </div>
    </div>
  </div>
</template>
