<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ManualScalerTraitTab',
  components: {
    LabeledInput,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.manualScalerTrait');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :button-label="t('verrazzano.common.messages.removeTypeFromComponent', { type: 'ManualScalerTrait' })"
        :mode="mode"
        @click="$emit('deleteTrait', 'ManualScalerTrait')"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('trait.kind')"
            :mode="mode"
            disabled
            :label="t('verrazzano.common.fields.kind')"
            @input="setFieldIfNotEmpty('trait.kind', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('trait.spec.replicaCount')"
            :mode="mode"
            required
            type="number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'trait.spec.replicaCount')"
            :label="t('verrazzano.common.fields.replicaCount')"
            @input="setNumberField('trait.spec.replicaCount', $event)"
          />
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
