<script>
// Added by Verrazzano
import ConfigMapKeySelector from '@pkg/components/ConfigMapKeySelector';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretKeySelector from '@pkg/components/SecretKeySelector';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'SecretOrConfigMapSelector',
  components: {
    ConfigMapKeySelector,
    LabeledSelect,
    SecretKeySelector,
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
    namespacedObject: {
      type:     Object,
      required: true
    },
  },
  data() {
    return { selectorType: 'configMap' };
  },
  computed: {
    typeOptions() {
      return [
        { value: 'configMap', label: this.t('verrazzano.common.types.selectorType.configMap') },
        { value: 'secret', label: this.t('verrazzano.common.types.selectorType.secret') },
      ];
    },
    isConfigMap() {
      return this.selectorType === 'configMap';
    },
    isSecret() {
      return this.selectorType === 'secret';
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="selectorType"
          :mode="mode"
          :options="typeOptions"
          option-key="value"
          option-label="label"
          :label="t('verrazzano.common.fields.selectorType')"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <ConfigMapKeySelector
        v-if="isConfigMap"
        :value="getField('configMap')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        @input="setFieldIfNotEmpty('configMap', $event)"
      />
      <SecretKeySelector
        v-else-if="isSecret"
        :value="getField('secret')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        @input="setFieldIfNotEmpty('secret', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
