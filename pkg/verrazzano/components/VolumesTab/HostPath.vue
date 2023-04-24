<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'HostPath',
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
  computed: {
    typeOptions() {
      return [
        { value: '', label: this.t('verrazzano.common.types.hostPath.default') },
        { value: 'DirectoryOrCreate', label: this.t('verrazzano.common.types.hostPath.directoryOrCreate') },
        { value: 'Directory', label: this.t('verrazzano.common.types.hostPath.directory') },
        { value: 'FileOrCreate', label: this.t('verrazzano.common.types.hostPath.fileOrCreate') },
        { value: 'File', label: this.t('verrazzano.common.types.hostPath.file') },
        { value: 'Socket', label: this.t('verrazzano.common.types.hostPath.socket') },
        { value: 'CharDevice', label: this.t('verrazzano.common.types.hostPath.charDevice') },
        { value: 'BlockDevice', label: this.t('verrazzano.common.types.hostPath.blockDevice') },
      ];
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput
        :value="getField('path')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'path')"
        :label="t('verrazzano.common.fields.volumes.hostPath.path')"
        @input="setFieldIfNotEmpty('path', $event)"
      />
    </div>
    <div class="col span-6">
      <LabeledSelect
        :value="getField('type')"
        :mode="mode"
        :options="typeOptions"
        option-key="value"
        option-label="label"
        :placeholder="getNotSetPlaceholder(value, 'type')"
        :label="t('verrazzano.common.fields.volumes.hostPath.type')"
        @input="setFieldIfNotEmpty('type', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
