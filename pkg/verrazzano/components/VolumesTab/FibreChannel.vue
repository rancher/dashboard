<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'FibreChannel',
  components: {
    Checkbox,
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
  },
  computed: {
    showTargetWWNs() {
      const lun = this.getField('lun');

      return !(typeof lun === 'undefined');
    },
  },
  watch: {
    'value.lun'(neu, old) {
      if (typeof neu === 'undefined') {
        this.setField('targetWWNs', undefined);
      } else {
        this.setField('wwids', undefined);
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('fsType')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'fsType')"
          :label="t('verrazzano.common.fields.volumes.fc.fsType')"
          @input="setFieldIfNotEmpty('fsType', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('lun')"
          :mode="mode"
          type="Number"
          min="0"
          :placeholder="getNotSetPlaceholder(value, 'lun')"
          :label="t('verrazzano.common.fields.volumes.fc.lun')"
          @input="setNumberField('lun', $event)"
        />
      </div>
      <div class="col span-4">
        <Checkbox
          :value="getField('readOnly')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.fc.readOnly')"
          @input="setBooleanField('readOnly', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div v-if="showTargetWWNs">
      <LabeledArrayList
        :value="getListField('targetWWNs')"
        :mode="mode"
        :value-label="t('verrazzano.common.fields.volumes.fc.targetWwn')"
        :add-label="t('verrazzano.common.buttons.addTargetWwn')"
        @input="setFieldIfNotEmpty('targetWWNs', $event)"
      />
    </div>
    <div v-else>
      <LabeledArrayList
        :value="getListField('wwids')"
        :mode="mode"
        :value-label="t('verrazzano.common.fields.volumes.fc.wwid')"
        :add-label="t('verrazzano.common.buttons.addWwid')"
        @input="setFieldIfNotEmpty('wwids', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
