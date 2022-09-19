<script>
// Added by Verrazzano
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabelSelectorTab from '@pkg/components/LabelSelectorTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NetworkPolicyPeerTab',
  components: {
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    LabelSelectorTab,
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
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const { namespaceSelector, podSelector } = this.value;
    const networkPolicyPeerType = namespaceSelector || podSelector ? 'selectors' : 'ipBlock';

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      networkPolicyPeerType,
    };
  },
  computed: {
    networkPolicyPeerOptions() {
      return [
        { value: 'ipBlock', label: this.t('verrazzano.common.types.networkPeerPolicy.ipBlock') },
        { value: 'selectors', label: this.t('verrazzano.common.types.networkPeerPolicy.selectors') },
      ];
    },
    isIpBlock() {
      return this.networkPolicyPeerType === 'ipBlock';
    },
    isSelectors() {
      return this.networkPolicyPeerType === 'selectors';
    }
  },
  methods: {
    deleteNetworkPolicyPeer() {
      this.$emit('delete', this.value);
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicyPeer');
    }
  },
  watch: {
    networkPolicyPeerType(neu, _old) {
      if (neu) {
        if (neu === 'ipBlock') {
          this.setField('namespaceSelector', undefined);
          this.setField('podSelector', undefined);
        } else {
          this.setField('ipBlock', undefined);
        }
      }
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
        @click="deleteNetworkPolicyPeer()"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            v-model="networkPolicyPeerType"
            :mode="mode"
            :options="networkPolicyPeerOptions"
            option-key="value"
            option-label="label"
            :label="t('verrazzano.common.fields.networkPolicyPeerType')"
          />
        </div>
        <div v-if="isIpBlock" class="col span-4">
          <LabeledInput
            :value="getField('cidr')"
            :mode="mode"
            required
            :placeholder="getNotSetPlaceholder(value, 'cidr')"
            :label="t('verrazzano.common.fields.cidr')"
            @input="setFieldIfNotEmpty('cidr', $event)"
          />
        </div>
        <div v-if="isIpBlock" class="col span-4">
          <LabeledArrayList
            :value="getListField('except')"
            :mode="mode"
            :add-label="t('verrazzano.common.buttons.addExcept')"
            :value-label="t('verrazzano.common.fields.except')"
            @input="setFieldIfNotEmpty('except', $event)"
          />
        </div>
      </div>
    </template>
    <template v-if="isSelectors" #nestedTabs>
      <LabelSelectorTab
        :value="getField('namespaceSelector')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'namespaceSelector')"
        :tab-label="t('verrazzano.common.tabs.namespaceSelector')"
        @input="setFieldIfNotEmpty('namespaceSelector', $event)"
      />
      <LabelSelectorTab
        :value="getField('podSelector')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'podSelector')"
        :tab-label="t('verrazzano.common.tabs.podSelector')"
        @input="setFieldIfNotEmpty('podSelector', $event)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
