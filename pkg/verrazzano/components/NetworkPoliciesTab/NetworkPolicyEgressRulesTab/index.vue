<script>
// Added by Verrazzano
import NetworkPolicyEgressRuleTab
  from '@pkg/components/NetworkPoliciesTab/NetworkPolicyEgressRulesTab/NetworkPolicyEgressRuleTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'NetworkPolicyEgressRulesTab',
  components: {
    NetworkPolicyEgressRuleTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
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
    weight: {
      default: 0,
      type:    Number
    },
  },
  data() {
    const egressRules = this.value.map((rule) => {
      const newRule = this.clone(rule);

      newRule._id = randomStr(4);

      return newRule;
    });

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      egressRules,
    };
  },
  methods: {
    update() {
      const egressRules = [];

      this.egressRules.forEach((rule) => {
        const newRule = this.clone(rule);

        delete newRule._id;

        egressRules.push(newRule);
      });
      this.$emit('input', egressRules);
    },
    getEgressRuleLabel(index) {
      return `${ this.t('verrazzano.common.tabs.networkPolicyEgressRule') } ${ index + 1 }`;
    },
    getEgressRuleTabName(index) {
      return this.createTabName(this.treeTabName, `egressRule${ index + 1 }`);
    },
    addEgressRule() {
      this.egressRules.push({ _id: randomStr(4) });
    },
    removeEgressRule(index) {
      this.egressRules.splice(index, 1);
      this.queueUpdate();
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicyEgressRules');
    }

    this.queueUpdate = debounce(this.update, 500);
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :weight="weight">
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
          <button
            type="button"
            class="btn role-tertiary add"
            data-testid="add-item"
            :disabled="isView"
            @click="addEgressRule()"
          >
            {{ t('verrazzano.common.buttons.addNetworkPolicyEgressRule') }}
          </button>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <NetworkPolicyEgressRuleTab
        v-for="(egressRule, idx) in egressRules"
        :key="egressRule._id"
        :value="egressRule"
        :mode="mode"
        :tab-name="getEgressRuleTabName(idx)"
        :tab-label="getEgressRuleLabel(idx)"
        @input="queueUpdate"
        @delete="removeEgressRule(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
