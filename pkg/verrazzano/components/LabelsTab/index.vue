<script>
// Added by Verrazzano
import Labels from '@pkg/components/LabelsTab/Labels';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'LabelsTab',
  components: {
    Labels,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      // parent object (e.g., metadata object)
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
  methods: {
    clearLabelsAndAnnotations() {
      this.setField('annotations', undefined);
      this.setField('labels', undefined);
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.labelsAndAnnotations');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :title="t('verrazzano.common.titles.labels')">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="clearLabelsAndAnnotations"
      />
    </template>
    <template #default>
      <Labels
        :value="value"
        :mode="mode"
        suppress-labels-title
        @input="$emit('input', value)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
