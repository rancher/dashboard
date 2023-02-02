<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'AuxiliaryImage',
  components: {
    LabeledInput,
    LabeledSelect
  },
  mixins: [WebLogicWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create',
    },
    weight: {
      type:    Number,
      default: 0
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
          :value="getField('sourceModelHome')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'sourceModelHome')"
          :label="t('verrazzano.weblogic.fields.configuration.model.modelHome')"
          @input="setFieldIfNotEmpty('sourceModelHome', $event)"
        />
      </div>
      <!--

      -->
      <div class="col span-9">
        <LabeledInput
          :value="getField('sourceWDTInstallHome')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'sourceWDTInstallHome')"
          :label="t('verrazzano.weblogic.fields.configuration.model.wdtInstallHome')"
          @input="setFieldIfNotEmpty('sourceWDTInstallHome', $event)"
        />
      </div>
    </div>
  </div>
</template>
