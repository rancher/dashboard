<script>
// Added by Verrazzano
import FieldRef from '@pkg/components/VolumesTab/DownwardAPI/FieldRef';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import ResourceFieldRef from '@pkg/components/VolumesTab/DownwardAPI/ResourceFieldRef';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'DownwardAPIVolumeFile',
  components: {
    FieldRef,
    LabeledInput,
    ResourceFieldRef,
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
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="getField('path')"
          :mode="mode"
          required
          :placeholder="getNotSetPlaceholder(value, 'path')"
          :label="t('verrazzano.common.fields.volumes.downwardApi.path')"
          @input="setFieldIfNotEmpty('path', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="getField('mode')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'mode')"
          :label="t('verrazzano.common.fields.volumes.downwardApi.mode')"
          @input="setNumberField('mode', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <h4>{{ t('verrazzano.common.titles.volumes.downwardApi.fieldRef') }}</h4>
      <FieldRef
        :value="getField('fieldRef')"
        :mode="mode"
        @input="setFieldIfNotEmpty('fieldRef', $event)"
      />
    </div>
    <div class="spacer-small" />
    <div>
      <h4>{{ t('verrazzano.common.titles.volumes.downwardApi.resourceFieldRef') }}</h4>
      <ResourceFieldRef
        :value="getField('resourceFieldRef')"
        :mode="mode"
        @input="setFieldIfNotEmpty('resourceFieldRef', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
