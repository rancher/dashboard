<script>
import { SERVICE } from '@/config/types';
import SortableTable from '@/components/SortableTable';
import { _VIEW } from '@/config/query-params';
import Rule from './Rule';

export default {
  components: { Rule, SortableTable },

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

  data() {
    return { rules: this.value.spec.rules };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    ruleHeaders() {
      return [
        {
          name:      'path',
          label:     this.t('ingress.rules.headers.path'),
          formatter: 'Link',
          value:     'pathLink'
        },
        {
          name:      'target',
          label:     this.t('ingress.rules.headers.target'),
          formatter: 'Link',
          value:     'targetLink',
        },
        {
          name:  'port',
          label: this.t('ingress.rules.headers.port'),
          value: 'backend.servicePort'
        }
      ];
    },
    ruleRows() {
      return this.rules
        .filter(rule => rule?.http?.paths)
        .map((rule) => {
          return {
            ...rule,
            http: { paths: this.withUrl(rule.host, rule.http.paths) }
          };
        });
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

    withUrl(host, paths = []) {
      const rows = paths.map((path) => {
        const serviceName = path?.backend?.serviceName;
        const name = 'c-cluster-resource-namespace-id';
        const params = {
          resource:  SERVICE,
          id:        serviceName,
          namespace: this.value?.metadata?.namespace
        };

        const targetUrl = { name, params };
        const pathUrl = `https://${ host }${ path?.path }`;

        path.targetLink = {
          url:     targetUrl,
          text:    path?.backend?.serviceName,
          options: 'internal'
        };
        path.pathLink = {
          url:     pathUrl,
          text:    path?.path,
        };

        return path;
      });

      return rows;
    },
  }
};
</script>

<template>
  <div v-if="isView">
    <div v-for="(rule, i) in ruleRows" :key="i" class="rule mb-20">
      <label>{{ t('ingress.rules.hostname') }}</label>
      <div class="mb-20">
        {{ rule.host }}
      </div>
      <SortableTable
        :rows="rule.http.paths"
        :headers="ruleHeaders"
        key-field="_key"
        :search="false"
        :table-actions="false"
        :row-actions="false"
      />
    </div>
  </div>
  <div v-else>
    <Rule
      v-for="(rule, i) in rules"
      :key="i"
      :value="rule"
      :service-targets="serviceTargets"
      @remove="e=>removeRule(i)"
      @input="e=>updateRule(e,i)"
    />
    <button class="btn role-tertiary add mt-10 " type="button" @click="addRule">
      {{ t('ingress.rules.addRule') }}
    </button>
  </div>
</template>
