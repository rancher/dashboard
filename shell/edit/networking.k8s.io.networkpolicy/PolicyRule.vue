<script>

import PolicyRulePort from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRulePort';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { _EDIT } from '@shell/config/query-params';
import PolicyRuleTarget from '@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget';

export default {
  components: {
    ArrayListGrouped, PolicyRulePort, PolicyRuleTarget
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    type: {
      type:    String,
      default: 'ingress'
    },
    namespace: {
      type:    String,
      default: ''
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
    return { targetKey: this.type === 'ingress' ? 'from' : 'to' };
  }
};
</script>

<template>
  <div class="rule">
    <div class="row mb-40">
      <div class="col span-12">
        <h2>
          {{ t(`networkpolicy.${type}.ruleLabel`) }}
          <i
            v-clean-tooltip="t(`networkpolicy.${type}.ruleHint`)"
            class="icon icon-info"
          />
        </h2>
        <ArrayListGrouped
          v-model:value="value[targetKey]"
          :add-label="t(`networkpolicy.rules.${type}.add`)"
          :default-add-value="{}"
          :mode="mode"
        >
          <template #default="props">
            <PolicyRuleTarget
              ref="lastTarget"
              v-model:value="props.row.value"
              :mode="mode"
              :type="type"
              :namespace="namespace"
              :all-namespaces="allNamespaces"
              :all-pods="allPods"
              :data-testid="`policy-rule-target-${props.i}`"
            />
          </template>
        </ArrayListGrouped>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <h2>
          {{ t('networkpolicy.rules.ports.label') }}
          <i
            v-clean-tooltip="t(`networkpolicy.${type}.portHint`)"
            class="icon icon-info"
          />
        </h2>
        <ArrayListGrouped
          v-model:value="value.ports"
          :add-label="t('networkpolicy.rules.addPort')"
          :default-add-value="{}"
          :mode="mode"
        >
          <template #default="props">
            <PolicyRulePort
              ref="lastPort"
              v-model:value="props.row.value"
              :mode="mode"
            />
          </template>
        </ArrayListGrouped>
      </div>
    </div>
  </div>
</template>
