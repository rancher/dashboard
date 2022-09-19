<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'WebLogicChannel',
  components: { LabeledInput },
  mixins:     [WeblogicWorkloadHelper],
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('channelName')"
          :mode="mode"
          :label="t('verrazzano.weblogic.fields.adminServer.channelName')"
          @input="setFieldIfNotEmpty('channelName', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('nodePort')"
          :mode="mode"
          :label="t('verrazzano.weblogic.fields.adminServer.nodePort')"
          @input="setNumberField('nodePort', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
