<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import Labels from '@pkg/components/LabelsTab/Labels';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicChannel from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/AdminServerTab/WebLogicChannel';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'AdminServiceTab',
  components: {
    ArrayListGrouped,
    Labels,
    TabDeleteButton,
    TreeTab,
    WebLogicChannel,
  },
  mixins: [WeblogicWorkloadHelper, DynamicListHelper],
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
  methods: {
    getDynamicListRootFieldName() {
      return 'channels';
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.adminService');
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
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <ArrayListGrouped
        :value="dynamicListChildren"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.weblogic.buttons.addChannel')"
        @add="dynamicListAddChild()"
      >
        <template #remove-button="removeProps">
          <button
            v-if="dynamicListShowRemoveButton"
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
          <WebLogicChannel
            :value="props.row.value"
            :mode="mode"
            @input="dynamicListUpdate"
          />
        </template>
      </ArrayListGrouped>
      <div class="spacer" />
      <div>
        <Labels
          :value="value"
          :mode="mode"
          @input="$emit('input', value)"
        />
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
