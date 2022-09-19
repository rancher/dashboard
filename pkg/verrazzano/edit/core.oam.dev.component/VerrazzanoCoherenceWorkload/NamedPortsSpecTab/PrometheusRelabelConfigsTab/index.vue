<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import PrometheusRelabelConfigTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NamedPortsSpecTab/PrometheusRelabelConfigsTab/PrometheusRelabelConfigTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'PrometheusRelabelConfigsTab',
  components: {
    PrometheusRelabelConfigTab,
    TabDeleteButton,
    TreeTab,
  },
  inject: ['selectTab'],
  mixins: [CoherenceWorkloadHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:     String,
      required: true
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  methods: {
    getDynamicListTabName(child) {
      if (child) {
        const idx = this.dynamicListChildren.findIndex(dlChild => dlChild._id === child._id);

        if (idx > -1) {
          return this.getItemTabName(idx);
        }
      }

      return this.treeTabName;
    },
    addRelabelConfig() {
      this.dynamicListAddChild();
      this.selectTab(this.getItemTabName(this.dynamicListChildren.length - 1));
    },
    getItemTabName(idx) {
      return this.createTabName(this.treeTabName, `reconfig${ idx + 1 }`);
    },
    getItemTabLabel(idx) {
      return this.t('verrazzano.coherence.tabs.reconfigItem', { number: idx + 1 });
    },
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
      <button
        type="button"
        :disabled="isView"
        class="btn role-tertiary add"
        @click="addRelabelConfig()"
      >
        {{ t('verrazzano.coherence.buttons.addRelabelConfig') }}
      </button>
    </template>
    <template #nestedTabs>
      <PrometheusRelabelConfigTab
        v-for="(configItem, idx) in dynamicListChildren"
        :key="configItem._id"
        :value="configItem"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="getItemTabName(idx)"
        :tab-label="getItemTabLabel(idx)"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
