<script>
// Added by Verrazzano
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NamespaceTab from '@pkg/edit/clusters.verrazzano.io.verrazzanoproject/NamespacesTab/NamespaceTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { NAMESPACE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'NamespacesTab',
  components: {
    LabeledSelect,
    NamespaceTab,
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
    const usedNamespaceNames = this.value.map(namespace => namespace.metadata.name);

    return {
      fetchInProgress:  true,
      allNamespaces:    [],
      unusedNamespaces: [],
      treeTabName:      this.tabName,
      treeTabLabel:     this.tabLabel,
      chosenNamespace:  '',
      usedNamespaceNames,
    };
  },
  async fetch() {
    const requests = { namespaces: this.$store.dispatch('management/findAll', { type: NAMESPACE }) };

    const hash = await allHash(requests);

    if (hash.namespaces) {
      this.allNamespaces = hash.namespaces;
    }
    this.fetchInProgress = false;
  },
  computed: {
    namespaceType() {
      return this.t('verrazzano.common.fields.namespace');
    },
  },
  methods: {
    setUnusedNamespaces() {
      this.unusedNamespaces = this.allNamespaces.filter(namespace => !this.usedNamespaceNames.includes(namespace.metadata.name));
    },
    getDynamicListTabName(child) {
      return this.createTabName(this.treeTabName, child?.metadata?.name);
    },
    setChosenNamespace(namespace) {
      this.chosenNamespace = namespace;
    },
    addNamespace() {
      if (this.chosenNamespace) {
        this.dynamicListAddChild({ metadata: { name: this.chosenNamespace } });
        this.usedNamespaceNames.push(this.chosenNamespace);
        this.setUnusedNamespaces();
        this.chosenNamespace = '';
      }
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.namespaces');
    }
  },
  watch: {
    fetchInProgress() {
      this.setUnusedNamespaces();
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
        @click="dynamicListClearChildrenList"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            :value="chosenNamespace"
            :mode="mode"
            :required="true"
            :options="unusedNamespaces"
            option-label="metadata.name"
            :reduce="namespace => namespace.metadata.name"
            :label="t('verrazzano.common.fields.namespace')"
            @input="setChosenNamespace($event)"
          />
        </div>
        <div class="col span-4">
          <button
            type="button"
            class="btn role-tertiary add"
            data-testid="add-item"
            :disabled="isView || !chosenNamespace"
            @click="addNamespace()"
          >
            {{ t('verrazzano.common.buttons.addElement', { type: namespaceType }) }}
          </button>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <NamespaceTab
        v-for="(namespace, idx) in dynamicListChildren"
        :key="namespace._id"
        :value="namespace"
        :mode="mode"
        :tab-name="getDynamicListTabName(namespace)"
        :tab-label="namespace.metadata.name"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
