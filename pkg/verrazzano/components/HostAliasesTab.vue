<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import DynamicTabHelper from '@pkg/mixins/dynamic-tab-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'HostAliasesTab',
  components: {
    AddNamedElement,
    LabeledArrayList,
    LabeledInput,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper, DynamicTabHelper, DynamicListHelper],
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
    }
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  methods: {
    getDynamicListTabName(child) {
      return this.createTabName(this.treeTabName, child?.ip);
    },
    clearHostAliases() {
      this.dynamicListClearChildrenList();
    },
    addHostAlias(newIpAddress) {
      this.dynamicListAddChild({ ip: newIpAddress });
    },
    removeHostAlias(index) {
      this.dynamicListDeleteChildByIndex(index);
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.hostAliases');
    }
  }
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :mode="mode"
        :element-name="treeTabLabel"
        @click="clearHostAliases()"
      />
    </template>
    <template #default>
      <AddNamedElement
        :value="dynamicListChildren"
        :mode="mode"
        key-field-name="ip"
        :add-type="t('verrazzano.common.tabs.hostAlias')"
        :field-label="t('verrazzano.common.fields.newIpAddress')"
        @input="addHostAlias($event)"
      />
    </template>
    <template #nestedTabs>
      <TreeTab
        v-for="(hostAlias, idx) in dynamicListChildren"
        :key="hostAlias._id"
        :name="createTabName(treeTabName, hostAlias.ip)"
        :label="hostAlias.ip"
      >
        <template #beside-header>
          <TabDeleteButton
            :mode="mode"
            :element-name="t('verrazzano.common.tabs.hostAlias')"
            @click="removeHostAlias(idx)"
          />
        </template>
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getDynamicTabField(hostAlias, 'ip')"
                :mode="mode"
                required
                disabled
                :placeholder="getNotSetPlaceholder(hostAlias, 'ip')"
                :label="t('verrazzano.common.fields.ipAddress')"
                @input="setDynamicTabFieldIfNotEmpty(hostAlias, 'ip', $event, true)"
              />
            </div>
            <div class="col span-4">
              <LabeledArrayList
                :value="getDynamicTabListField(hostAlias, 'hostnames')"
                :mode="mode"
                required
                :value-label="t('verrazzano.common.fields.hostname')"
                :add-label="t('verrazzano.common.buttons.addHostName')"
                initial-empty-row
                @input="setDynamicTabFieldIfNotEmpty(hostAlias, 'hostnames', $event, true)"
              />
            </div>
          </div>
        </template>
      </TreeTab>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
