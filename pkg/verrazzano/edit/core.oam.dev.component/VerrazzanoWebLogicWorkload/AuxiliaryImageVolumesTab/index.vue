<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import AuxiliaryImageVolume
  from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/AuxiliaryImageVolumesTab/AuxiliaryImageVolume';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'AuxiliaryImageVolumesTab',
  components: {
    ArrayListGrouped,
    AuxiliaryImageVolume,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [WeblogicWorkloadHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
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
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.auxiliaryImageVolumes');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="dynamicListClearChildrenList"
      />
    </template>
    <template #default>
      <ArrayListGrouped
        :value="dynamicListChildren"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.weblogic.buttons.addAuxiliaryImageVolume')"
        @add="dynamicListAddChild({})"
      >
        <template #remove-button="removeProps">
          <button
            v-if="dynamicListShowRemoveButton()"
            type="button"
            class="btn role-link close btn-sm"
            @click="dynamicListDeleteChildByIndex(removeProps.i)"
          >
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else />
        </template>
        <template #default="props">
          <div class="spacer-small" />
          <AuxiliaryImageVolume
            :value="props.row.value"
            :mode="mode"
            @input="dynamicListUpdate"
          />
        </template>
      </ArrayListGrouped>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
