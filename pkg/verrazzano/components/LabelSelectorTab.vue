<script>
// Added by Verrazzano
import PodAffinityTerm from '@pkg/components/PodAffinityTerm';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'LabelSelectorTab',
  components: {
    PodAffinityTerm,
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
      type:      String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: '',
    },
    weight: {
      default: 0,
      type:    Number
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.labelSelector');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :weight="weight">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <PodAffinityTerm
        :value="value"
        :mode="mode"
        @input="$emit('input', value)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
