<script>
// Added by Verrazzano
import NetworkPolicyIngressRuleTab
  from '@pkg/components/NetworkPoliciesTab/NetworkPolicyIngressRulesTab/NetworkPolicyIngressRuleTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'NetworkPolicyIngressRulesTab',
  components: {
    NetworkPolicyIngressRuleTab,
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
    const ingressRules = this.value.map((rule) => {
      const newRule = this.clone(rule);

      newRule._id = randomStr(4);

      return newRule;
    });

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      ingressRules,
    };
  },
  methods: {
    update() {
      const ingressRules = [];

      this.ingressRules.forEach((rule) => {
        const newRule = this.clone(rule);

        delete newRule._id;

        ingressRules.push(newRule);
      });
      this.$emit('input', ingressRules);
    },
    getIngressRuleLabel(index) {
      return `${ this.t('verrazzano.common.tabs.networkPolicyIngressRule') } ${ index + 1 }`;
    },
    getIngressRuleTabName(index) {
      return this.createTabName(this.treeTabName, `ingressRule${ index + 1 }`);
    },
    addIngressRule() {
      this.ingressRules.push({ _id: randomStr(4) });
    },
    removeIngressRule(index) {
      this.ingressRules.splice(index, 1);
      this.queueUpdate();
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicyIngressRules');
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
            @click="addIngressRule()"
          >
            {{ t('verrazzano.common.buttons.addNetworkPolicyIngressRule') }}
          </button>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <NetworkPolicyIngressRuleTab
        v-for="(ingressRule, idx) in ingressRules"
        :key="ingressRule._id"
        :value="ingressRule"
        :mode="mode"
        :tab-name="getIngressRuleTabName(idx)"
        :tab-label="getIngressRuleLabel(idx)"
        @input="queueUpdate"
        @delete="removeIngressRule(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
