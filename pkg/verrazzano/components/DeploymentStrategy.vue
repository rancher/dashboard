<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'DeploymentStrategy',
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
  data() {
    return { isLoading: true };
  },
  computed:   {
    deploymentStrategyTypeOptions() {
      return [
        { value: 'RollingUpdate', label: this.t('verrazzano.common.types.deploymentStrategy.rollingUpdate') },
        { value: 'Recreate', label: this.t('verrazzano.common.types.deploymentStrategy.recreate') },
      ];
    },
    usingRollingUpdateStrategy() {
      return this.getField('type') !== 'Recreate';
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    'value.type'(neu, old) {
      if (!this.loading && neu === 'Recreate') {
        this.setField('rollingUpdate', undefined);
      }
    }
  }
};
</script>

<template>
  <div>
    <div :style="{'align-items':'center'}" class="row mb-20">
      <div class="col span-4">
        <LabeledSelect
          :value="getField('type')"
          :mode="mode"
          :options="deploymentStrategyTypeOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'type')"
          :label="t('verrazzano.common.fields.deploymentStrategy.type')"
          @input="setFieldIfNotEmpty('type', $event)"
        />
      </div>
      <div v-if="usingRollingUpdateStrategy" class="col span-4">
        <LabeledInput
          :value="getField('rollingUpdate.maxSurge')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'rollingUpdate.maxSurge')"
          :label="t('verrazzano.common.fields.deploymentStrategy.maxSurge')"
          @input="setFieldIfNotEmpty('rollingUpdate.maxSurge', $event)"
        />
      </div>
      <div v-if="usingRollingUpdateStrategy" class="col span-4">
        <LabeledInput
          :value="getField('rollingUpdate.maxUnavailable')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'rollingUpdate.maxUnavailable')"
          :label="t('verrazzano.common.fields.deploymentStrategy.maxUnavailable')"
          @input="setFieldIfNotEmpty('rollingUpdate.maxUnavailable', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
