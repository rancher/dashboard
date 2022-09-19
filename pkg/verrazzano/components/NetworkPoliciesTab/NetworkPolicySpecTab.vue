<script>
// Added by Verrazzano
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabelSelectorTab from '@pkg/components/LabelSelectorTab';
import NetworkPolicyEgressRulesTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicyEgressRulesTab';
import NetworkPolicyIngressRulesTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicyIngressRulesTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NetworkPolicySpecTab',
  components: {
    LabeledSelect,
    LabelSelectorTab,
    NetworkPolicyEgressRulesTab,
    NetworkPolicyIngressRulesTab,
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
    const policyTypes = this.getPolicyTypesStringValue(this.getListField('policyTypes'));

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      policyTypes,
    };
  },
  computed: {
    policyTypeOptions() {
      return [
        { value: 'Ingress', label: this.t('verrazzano.common.types.networkPolicyTypes.ingress') },
        { value: 'Egress', label: this.t('verrazzano.common.types.networkPolicyTypes.egress') },
        { value: 'IngressEgress', label: this.t('verrazzano.common.types.networkPolicyTypes.ingressEgress') },
      ];
    },
    showIngressTab() {
      return this.policyTypes !== 'Egress';
    },
    showEgressTab() {
      return this.policyTypes !== 'Ingress';
    }
  },
  methods: {
    getPolicyTypesStringValue(policyTypesArray) {
      let results;

      if (policyTypesArray.length === 2) {
        results = 'ingressEgress';
      } else if (policyTypesArray.length === 1) {
        results = policyTypesArray[0];
      }

      return results;
    },
    getPolicyTypesValueFromString(policyTypesString) {
      let results;

      switch (policyTypesString) {
      case 'Ingress':
      case 'Egress':
        results = [policyTypesString];
        break;

      case 'IngressEgress':
        results = ['Ingress', 'Egress'];
        break;
      }

      return results;
    },
    getPolicyTypesPlaceholder() {
      return this.getNotSetPlaceholder(this, 'policyTypes');
    },
    setPolicyTypes(policyTypes) {
      this.setFieldIfNotEmpty('policyTypes', this.getPolicyTypesValueFromString(policyTypes));
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicySpec');
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
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            v-model="policyTypes"
            :mode="mode"
            :options="policyTypeOptions"
            option-key="value"
            option-label="label"
            :placeholder="getPolicyTypesPlaceholder()"
            :label="t('verrazzano.common.fields.networkPolicyTypes')"
            @input="setPolicyTypes($event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <NetworkPolicyEgressRulesTab
        v-if="showEgressTab"
        :value="getListField('egress')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'egress')"
        :tab-label="t('verrazzano.common.tabs.egress')"
        :weight="1"
        @input="setFieldIfNotEmpty('egress', $event)"
        @delete="setField('egress', undefined)"
      />
      <NetworkPolicyIngressRulesTab
        v-if="showIngressTab"
        :value="getListField('ingress')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'ingress')"
        :tab-label="t('verrazzano.common.tabs.ingress')"
        :weight="2"
        @input="setFieldIfNotEmpty('ingress', $event)"
        @delete="setField('ingress', undefined)"
      />
      <LabelSelectorTab
        :value="getField('podSelector')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'podSelector')"
        :tab-label="t('verrazzano.common.tabs.podSelector')"
        :weight="3"
        @input="setFieldIfNotEmpty('podSelector', $event)"
        @delete="setField('podSelector', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
