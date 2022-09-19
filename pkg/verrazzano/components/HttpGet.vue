<script>
// Added by Verrazzano
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ProbeHttpGet',
  components: {
    LabeledArrayList,
    LabeledInput,
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
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-3">
        <LabeledInput
          :value="getField('scheme')"
          :mode="mode"
          :label="t('verrazzano.common.fields.httpGet.scheme')"
          @input="setField('scheme', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="getField('host')"
          :mode="mode"
          :label="t('verrazzano.common.fields.httpGet.host')"
          @input="setField('host', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="getField('port')"
          :mode="mode"
          :label="t('verrazzano.common.fields.httpGet.port')"
          required
          @input="setField('port', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="getField('path')"
          :mode="mode"
          :label="t('verrazzano.common.fields.httpGet.path')"
          @input="setField('path', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <LabeledArrayList
        :value="getListField('httpHeaders')"
        :mode="mode"
        :value-label="t('verrazzano.common.fields.httpGet.httpHeader')"
        :add-label="t('verrazzano.common.buttons.addHttpHeader')"
        initial-empty-row
        @input="setFieldIfNotEmpty('httpHeaders', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
