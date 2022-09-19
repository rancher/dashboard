<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import OAMConfigFile
  from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMConfigFilesTab/OAMConfigFile';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'OAMConfigFilesTab',
  components: {
    ArrayListGrouped,
    OAMConfigFile,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [ContainerizedWorkloadHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create',
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
    showConfigFileRemoveButton() {
      return !this.isView && this.dynamicListChildren.length > 0;
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.containerized.tabs.configFiles');
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
        :add-label="t('verrazzano.containerized.buttons.addConfigFile')"
        @add="dynamicListAddChild()"
      >
        <template #remove-button="removeProps">
          <button
            v-if="showConfigFileRemoveButton"
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
          <OAMConfigFile
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
