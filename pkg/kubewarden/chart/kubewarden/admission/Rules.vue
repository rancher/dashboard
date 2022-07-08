<script>
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';

import Rule from './Rule';

import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

export default {
  name: 'Rules',

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    Rule, Tab, Tabbed
  },

  async fetch() {
    this.apiGroups = await this.$store.dispatch('cluster/findAll', { type: 'apigroup' });
    this.rules = [];

    if ( !!this.value.policy ) {
      this.rules = this.value.policy.spec.rules;
    }
  },

  data() {
    return {
      apiGroups:  [],
      rules:      null,
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    addRule() {
      this.rules.push({});
    },

    removeRule(index) {
      removeAt(this.rules, index);
    },

    ruleLabel(rule, index) {
      return rule?.apiGroups?.[0] || index;
    }
  }
};
</script>

<template>
  <div class="row mb-40">
    <div class="col span-12">
      <Tabbed
        :side-tabs="true"
        :show-tabs-add-remove="!isView"
        @addTab="addRule"
        @removeTab="removeRule"
      >
        <Tab
          v-for="(rule, index) in rules"
          :key="'filtered-rule-' + index"
          :name="'rule-' + index"
          :label="`Rule - ${ ruleLabel(rule, index) }`"
          :show-header="false"
          class="container-group"
        >
          <Rule
            ref="lastRule"
            v-model="rules[index]"
            :mode="mode"
            :api-groups="apiGroups"
          />
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>
