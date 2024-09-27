<script>

import PolicyRule from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRule';
import { _EDIT } from '@shell/config/query-params';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { removeAt } from '@shell/utils/array';

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
    allPods: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    allNamespaces: {
      type:    Array,
      default: () => {
        return [];
      },
    },
  },
  data() {
    if (!this.value.spec[this.type]) {
      this.value.spec[this.type] = [];
    }

    return {};
  },
  methods: {
    addPolicyRule() {
      this.value.spec[this.type].push({});
    },
    removePolicyRule(idx) {
      removeAt(this.value.spec[this.type], idx);
    },
    policyRouleLabel(idx) {
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
          @addTab="addPolicyRule"
          @removeTab="removePolicyRule"
        >
          <Tab
            v-for="(policyRule, idx) in value.spec[type]"
            :key="idx"
            :name="'rule-' + type + idx"
            :label="policyRouleLabel(idx)"
            :show-header="false"
            class="container-group"
          >
            <PolicyRule
              ref="lastRule"
              v-model:value="value.spec[type][idx]"
              :mode="mode"
              :type="type"
              :namespace="value.metadata.namespace"
              :all-namespaces="allNamespaces"
              :all-pods="allPods"
            />
          </Tab>
        </Tabbed>
      </div>
    </div>
  </div>
</template>
