<script>
import { WORKLOAD_TYPES } from '@/config/types';
import Loading from '@/components/Loading';
import SortableTable from '@/components/SortableTable';
import { _VIEW } from '@/config/query-params';
import InfoBox from '@/components/InfoBox';
import Rule from './Rule';

export default {
  components: {
    InfoBox, Loading, Rule, SortableTable
  },

  props: {
    value: {
      type:    Object,
      default: () => {}
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    serviceTargets: {
      type:    Array,
      default: () => []
    }
  },

  async fetch() {
    await Promise.all(Object.values(WORKLOAD_TYPES).map(type => this.$store.dispatch('cluster/findAll', { type })));
  },

  data() {
    return { rules: this.value.spec.rules };
  },

  computed: {
    workloads() {
      return Object.values(WORKLOAD_TYPES).flatMap(type => this.$store.getters['cluster/all'](type));
    },
    isView() {
      return this.mode === _VIEW;
    },
    ruleHeaders() {
      const headers = [
        {
          name:      'path',
          label:     this.t('ingress.rules.headers.path'),
          value:     'path',
          width:     '25%'
        },
        {
          name:      'target',
          label:     this.t('ingress.rules.headers.target'),
          formatter: 'Link',
          value:     'targetLink',
          width:     '25%'
        },
        {
          name:  'port',
          label: this.t('ingress.rules.headers.port'),
          value: 'port',
          width: '25%'
        }
      ];

      if (this.value.showPathType) {
        headers.unshift({
          name:      'pathType',
          label:     this.t('ingress.rules.headers.pathType'),
          value:     'pathType',
          width:     '25%'
        });
      }

      return headers;
    },
    ruleRows() {
      return this.value.createRulesForDetailPage(this.workloads);
    },
  },

  methods: {
    addRule() {
      this.rules.push({});
    },
    removeRule(idx) {
      this.rules.splice(idx, 1);
    },

    updateRule(neu, idx) {
      this.$set(this.rules, idx, neu);
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="isView">
    <InfoBox v-for="(rule, i) in ruleRows" :key="i" class="rule mb-20">
      <label>{{ t('ingress.rules.hostname') }}</label>
      <div class="mb-20">
        {{ rule.host }}
      </div>
      <SortableTable
        :rows="rule.paths"
        :headers="ruleHeaders"
        key-field="_key"
        :search="false"
        :table-actions="false"
        :row-actions="false"
      />
    </InfoBox>
  </div>
  <div v-else>
    <Rule
      v-for="(rule, i) in rules"
      :key="i"
      :value="rule"
      :service-targets="serviceTargets"
      :ingress="value"
      @remove="e=>removeRule(i)"
      @input="e=>updateRule(e,i)"
    />
    <button class="btn role-tertiary add mt-10" type="button" @click="addRule">
      {{ t('ingress.rules.addRule') }}
    </button>
  </div>
</template>
