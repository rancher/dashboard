<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'SecretItem',
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
    secret: {
      type:     Object,
      required: true,
    }
  },
  data() {
    const keys = this.secret?.data ? [...Object.keys(this.secret.data)] : [];

    return { keys };
  },
  watch: {
    secret(neu, old) {
      // this watcher gets invoked on page reload when switching from Edit YAML to Edit Config...
      if (this.didNamedObjectReallyChange(neu, old)) {
        this.keys = this.secret?.data ? [...Object.keys(this.secret.data)] : [];
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
        :label="t('verrazzano.common.fields.volumes.secret.items.key')"
        @input="setFieldIfNotEmpty('key', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('path')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'path')"
        :label="t('verrazzano.common.fields.volumes.secret.items.path')"
        @input="setField('path', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        :value="getField('mode')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'mode')"
        :label="t('verrazzano.common.fields.volumes.secret.items.mode')"
        @input="setFieldIfNotEmpty('mode', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
