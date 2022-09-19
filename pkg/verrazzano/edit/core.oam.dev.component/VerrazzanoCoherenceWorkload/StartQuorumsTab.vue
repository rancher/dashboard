<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import DynamicTabHelper from '@pkg/mixins/dynamic-tab-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

import { NAMESPACE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'StartQuorumsTab',
  components: {
    ArrayListGrouped,
    LabeledInput,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper, DynamicListHelper, DynamicTabHelper],
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
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
      fetchInProgress: true,
      allNamespaces:   [],
    };
  },
  async fetch() {
    const requests = { namespaces: this.$store.dispatch('management/findAll', { type: NAMESPACE }) };

    const hash = await allHash(requests);

    this.allNamespaces = hash.namespaces;
    this.fetchInProgress = false;
  },
  computed: {
    namespaces() {
      return this.fetchInProgress ? [] : this.allNamespaces;
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.startQuorums');
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
        v-model="dynamicListChildren"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.coherence.buttons.addStartQuorum')"
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
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getDynamicTabField(props.row.value,'deployment')"
                :mode="mode"
                required
                :placeholder="getNotSetPlaceholder(value, 'deployment')"
                :label="t('verrazzano.coherence.fields.startQuorum.deployment')"
                @input="setDynamicTabFieldIfNotEmpty(props.row.value,'deployment', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledSelect
                :value="getDynamicTabField(props.row.value,'namespace')"
                :mode="mode"
                :options="namespaces"
                option-label="metadata.name"
                :reduce="namespace => namespace.metadata.name"
                :placeholder="getNotSetPlaceholder(value, 'deployment')"
                :label="t('verrazzano.coherence.fields.startQuorum.namespace')"
                @input="setDynamicTabFieldIfNotEmpty(props.row.value,'namespace', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                :value="getDynamicTabField(props.row.value,'podCount')"
                :mode="mode"
                type="Number"
                min="0"
                :placeholder="getNotSetPlaceholder(value, 'podCount')"
                :label="t('verrazzano.coherence.fields.startQuorum.podCount')"
                @input="setDynamicTabNumberField(props.row.value, 'podCount', $event)"
              />
            </div>
          </div>
        </template>
      </ArrayListGrouped>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
