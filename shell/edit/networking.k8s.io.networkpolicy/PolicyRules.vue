<script>

import PolicyRule from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRule';
import { _EDIT } from '@shell/config/query-params';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { removeAt } from '@shell/utils/array';

// Components shown for Network Policy --> Ingress/Egress Rules --> Rule Type are...
// Edit Network Policy --> `PolicyRules` 1 --> M `PolicyRule` 1 --> M `PolicyRuleTarget`

export default {
  components: {
    PolicyRule, Tabbed, Tab
  },
  props: {
    value: {
      type:    Object,
      default: () => {
      }
    },
    mode: {
      type:    String,
      default: _EDIT
    },
    type: {
      type:    String,
      default: 'ingress'
    },
    useTabbedHash: {
      type:    Boolean,
      default: undefined
    }
  },
  created() {
    if (!this.value.spec[this.type]) {
      this.value.spec[this.type] = [];
    }
  },
  methods: {
    addPolicyRule() {
      this.value.spec[this.type].push({});
    },
    removePolicyRule(idx) {
      removeAt(this.value.spec[this.type], idx);
    },
    policyRuleLabel(idx) {
      return this.t('networkpolicy.rules.ruleLabel', { index: idx + 1 });
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-40">
      <div class="col span-12">
        <Tabbed
          :side-tabs="true"
          :show-tabs-add-remove="mode !== 'view'"
          :use-hash="useTabbedHash"
          :default-tab="defaultTab"
          @addTab="addPolicyRule"
          @removeTab="removePolicyRule"
        >
          <Tab
            v-for="(policyRule, idx) in value.spec[type]"
            :key="idx"
            :name="'rule-' + type + idx"
            :label="policyRuleLabel(idx)"
            :show-header="false"
            class="container-group"
          >
            <PolicyRule
              ref="lastRule"
              v-model:value="value.spec[type][idx]"
              :mode="mode"
              :type="type"
              :namespace="value.metadata.namespace"
            />
          </Tab>
        </Tabbed>
      </div>
    </div>
  </div>
</template>
