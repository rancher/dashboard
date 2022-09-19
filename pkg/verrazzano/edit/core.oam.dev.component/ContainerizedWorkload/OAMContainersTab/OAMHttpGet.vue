<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import KeyValue from '@shell/components/form/KeyValue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';

export default {
  name:       'OAMHttpGet',
  components: {
    KeyValue,
    LabeledInput,
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
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('path')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'path')"
          :label="t('verrazzano.common.fields.httpGet.path')"
          @input="setFieldIfNotEmpty('path', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('port')"
          :mode="mode"
          type="Number"
          :min="minPortNumber"
          :max="maxPortNumber"
          required
          :placeholder="getNotSetPlaceholder(value, 'port')"
          :label="t('verrazzano.common.fields.httpGet.port')"
          @input="setFieldIfNotEmpty('port', $event)"
        />
      </div>
    </div>
    <div class="spacer" />
    <div>
      <h3>{{ t('verrazzano.common.titles.httpGetHeaders') }}</h3>
      <KeyValue
        :value="getField('httpHeaders')"
        :mode="mode"
        :add-label="t('verrazzano.common.buttons.addHttpHeader')"
        :read-allowed="false"
        @input="setFieldIfNotEmpty('httpHeaders', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
