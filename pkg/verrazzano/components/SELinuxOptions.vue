<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'SELinuxOptions',
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
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-3">
      <LabeledInput
        :value="getField('level')"
        :mode="mode"
        :label="t('verrazzano.common.fields.seLinuxOptions.level')"
        @input="setField('level', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('role')"
        :mode="mode"
        :label="t('verrazzano.common.fields.seLinuxOptions.role')"
        @input="setField('role', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('type')"
        :mode="mode"
        :label="t('verrazzano.common.fields.seLinuxOptions.type')"
        @input="setField('type', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('user')"
        :mode="mode"
        :label="t('verrazzano.common.fields.seLinuxOptions.user')"
        @input="setField('user', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
