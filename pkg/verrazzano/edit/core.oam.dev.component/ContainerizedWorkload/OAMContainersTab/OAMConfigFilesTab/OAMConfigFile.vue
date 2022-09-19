<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name:       'OAMConfigFile',
  components: {
    LabeledInput,
    LabeledSelect,
  },
  mixins: [ContainerizedWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create',
    },
  },
  data() {
    const { fromParam } = this.value;
    const fileType = !!fromParam ? 'fromParam' : 'value';

    return {
      loading: true,
      fileType
    };
  },
  computed: {
    fileTypeOptions() {
      return [
        { value: 'value', label: this.t('verrazzano.containerized.types.configFileType.value') },
        { value: 'fromParam', label: this.t('verrazzano.containerized.types.configFileType.fromParam') },
      ];
    }
  },
  mounted() {
    this.loading = false;
  },
  watch: {
    fileType(neu, old) {
      if (!this.loading && neu && old && neu !== old) {
        this.setField(old, undefined);
      }
    },
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledInput
        :value="getField('path')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'path')"
        :label="t('verrazzano.containerized.fields.configFile.path')"
        @input="setFieldIfNotEmpty('path', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        v-model="fileType"
        :mode="mode"
        required
        :options="fileTypeOptions"
        option-key="value"
        option-label="label"
        :label="t('verrazzano.containerized.fields.configFile.fileType')"
      />
    </div>
    <div class="col span-4">
      <LabeledInput
        v-if="fileType === 'fromParam'"
        :value="getField('fromParam')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'fromParam')"
        :label="t('verrazzano.containerized.fields.configFile.fromParam')"
        @input="setFieldIfNotEmpty('fromParam', $event)"
      />
      <LabeledInput
        v-else
        :value="getField('value')"
        :mode="mode"
        required
        :placeholder="getNotSetPlaceholder(value, 'value')"
        :label="t('verrazzano.containerized.fields.configFile.value')"
        @input="setFieldIfNotEmpty('value', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
