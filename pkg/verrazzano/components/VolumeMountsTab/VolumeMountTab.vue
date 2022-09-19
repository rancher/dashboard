<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'VolumeMountTab',
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
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
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  computed: {
    mountPropagationOptions() {
      return [
        { value: 'None', label: this.t('verrazzano.common.types.mountPropagationMode.none') },
        { value: 'HostToContainer', label: this.t('verrazzano.common.types.mountPropagationMode.hostToContainer') },
        { value: 'Bidirectional', label: this.t('verrazzano.common.types.mountPropagationMode.bidirectional') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.common.tabs.volumeMount');
    }
  }
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('name')"
              :mode="mode"
              required
              disabled
              :placeholder="getNotSetPlaceholder(value, 'name')"
              :label="t('verrazzano.common.fields.volumeMount.name')"
              @input="setFieldIfNotEmpty('name', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('mountPropagation')"
              :mode="mode"
              :options="mountPropagationOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'mountPropagation')"
              :label="t('verrazzano.common.fields.volumeMount.mountPropagation')"
              @input="setFieldIfNotEmpty('mountPropagation', $event)"
            />
          </div>
          <div class="col span-4">
            <Checkbox
              :value="getField('readOnly')"
              :mode="mode"
              :label="t('verrazzano.common.fields.volumeMount.readOnly')"
              @input="setBooleanField('readOnly', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('mountPath')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'mountPath')"
              :label="t('verrazzano.common.fields.volumeMount.mountPath')"
              @input="setFieldIfNotEmpty('mountPath', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('subPath')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'subPath')"
              :label="t('verrazzano.common.fields.volumeMount.subPath')"
              @input="setFieldIfNotEmpty('subPath', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('subPathExpr')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'subPathExpr')"
              :label="t('verrazzano.common.fields.volumeMount.subPathExpr')"
              @input="setFieldIfNotEmpty('subPathExpr', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
