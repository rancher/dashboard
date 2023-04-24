<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'AzureDisk',
  components: {
    Checkbox,
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
    }
  },
  computed: {
    cacheOptions() {
      return [
        { value: 'None', label: this.t('verrazzano.common.types.azureDisk.cachingMode.none') },
        { value: 'ReadOnly', label: this.t('verrazzano.common.types.azureDisk.cachingMode.readOnly') },
        { value: 'ReadWrite', label: this.t('verrazzano.common.types.azureDisk.cachingMode.readWrite') },
      ];
    },
    kindOptions() {
      return [
        { value: 'Shared', label: this.t('verrazzano.common.types.azureDisk.kind.shared') },
        { value: 'Dedicated', label: this.t('verrazzano.common.types.azureDisk.kind.dedicated') },
        { value: 'Managed', label: this.t('verrazzano.common.types.azureDisk.kind.managed') },
      ];
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('diskName')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'diskName')"
          :label="t('verrazzano.common.fields.volumes.azureDisk.diskName')"
          @input="setFieldIfNotEmpty('diskName', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('diskURI')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'diskURI')"
          :label="t('verrazzano.common.fields.volumes.azureDisk.diskUri')"
          @input="setFieldIfNotEmpty('diskURI', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('kind')"
          :mode="mode"
          :options="kindOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'kind')"
          :label="t('verrazzano.common.fields.volumes.azureDisk.kind')"
          @input="setFieldIfNotEmpty('kind', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('fsType')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'fsType')"
          :label="t('verrazzano.common.fields.volumes.azureDisk.fsType')"
          @input="setFieldIfNotEmpty('fsType', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('cachingMode')"
          :mode="mode"
          :options="cacheOptions"
          option-key="value"
          option-label="label"
          :placeholder="getNotSetPlaceholder(value, 'cachingMode')"
          :label="t('verrazzano.common.fields.volumes.azureDisk.cachingMode')"
          @input="setFieldIfNotEmpty('cachingMode', $event)"
        />
      </div>
      <div class="col span-4">
        <Checkbox
          :value="getField('readOnly')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.azureDisk.readOnly')"
          @input="setBooleanField('readOnly', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
