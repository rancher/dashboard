<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ConfigMapItem',
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
    configMap: {
      type:     Object,
      required: true,
    }
  },
  data() {
    const keys = this.configMap?.data ? [...Object.keys(this.configMap.data)] : [];

    return { keys };
  },
  watch: {
    configMap(neu, old) {
      // this watcher gets invoked on page reload when switching from Edit YAML to Edit Config...
      if (this.didNamedObjectReallyChange(neu, old)) {
        this.keys = this.configMap?.data ? [...Object.keys(this.configMap.data)] : [];
        if (!this.keys.includes(this.getField('key'))) {
          this.setField('key', '');
        }
      }
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledSelect
        :value="getField('key')"
        :mode="mode"
        required
        :options="keys"
        :placeholder="getNotSetPlaceholder(value, 'key')"
        :label="t('verrazzano.common.fields.volumes.configMap.items.key')"
        @input="setFieldIfNotEmpty('key', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('path')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'path')"
        :label="t('verrazzano.common.fields.volumes.configMap.items.path')"
        @input="setFieldIfNotEmpty('path', $event)"
      />
    </div>
    <div class="col span-4">
      <!-- This is not a type=Number to allow the user to enter an octal string -->
      <LabeledInput
        :value="getField('mode')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'mode')"
        :label="t('verrazzano.common.fields.volumes.configMap.items.mode')"
        @input="setField('mode', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
