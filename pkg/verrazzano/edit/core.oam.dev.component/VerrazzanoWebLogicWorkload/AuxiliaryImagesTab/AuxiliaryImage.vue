<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'AuxiliaryImage',
  components: {
    LabeledInput,
    LabeledSelect
  },
  mixins: [WeblogicWorkloadHelper],
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
      <div class="col span-9">
        <LabeledInput
          :value="getField('image')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'image')"
          :label="t('verrazzano.weblogic.fields.auxiliaryImage')"
          @input="setFieldIfNotEmpty('image', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          :value="getField('imagePullPolicy')"
          :mode="mode"
          :options="imagePullPolicyOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'imagePullPolicy')"
          :label="t('verrazzano.common.fields.imagePullPolicy')"
          @input="setFieldIfNotEmpty('imagePullPolicy', $event)"
        />
      </div>
    </div>
    <br />
    <div class="row">
      <div class="col span-3">
        <LabeledInput
          :value="getField('volume')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'volume')"
          :label="t('verrazzano.weblogic.fields.auxiliaryImageVolumeReference')"
          @input="setFieldIfNotEmpty('volume', $event)"
        />
      </div>
      <div class="col span-9">
        <LabeledInput
          :value="getField('command')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'command')"
          :label="t('verrazzano.weblogic.fields.auxiliaryImageCommand')"
          @input="setFieldIfNotEmpty('command', $event)"
        />
      </div>
    </div>
  </div>
</template>
