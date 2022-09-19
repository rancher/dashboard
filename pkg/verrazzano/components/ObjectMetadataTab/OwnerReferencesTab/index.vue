<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import OwnerReference from '@pkg/components/ObjectMetadataTab/OwnerReferencesTab/OwnerReference';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'OwnerReferencesTab',
  components: {
    ArrayListGrouped,
    OwnerReference,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper, DynamicListHelper],
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
      this.treeTabLabel = this.t('verrazzano.common.tabs.ownerReferences');
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
        :add-label="t('verrazzano.common.buttons.addOwnerReference')"
        @add="dynamicListAddChild()"
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
          <OwnerReference
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
