<script>
import { WORKLOAD_TYPES } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';
import { _VIEW } from '@shell/config/query-params';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { random32 } from '@shell/utils/string';
import Rule from './Rule';

export default {
  components: {
    ArrayListGrouped, Loading, Rule, SortableTable
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

    certificates: {
      type:    Array,
      default: () => []
    },

    serviceTargets: {
      type:    Array,
      default: () => []
    },

    rules: {
      default: () => ({
        requestHost: [],
        path:        [],
        port:        [],
        target:      []
      }),
      type: Object,
    }
  },

  async fetch() {
    await Promise.all(Object.values(WORKLOAD_TYPES).map(type => this.$store.dispatch('cluster/findAll', { type })));
  },

  beforeUpdate() {
    for (const rule of this.value.spec.rules) {
      if (!rule.vKey) {
        this.$set(rule, 'vKey', random32(1));
      }
    }
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
          name:      'fullPath',
          label:     this.t('ingress.rules.headers.path'),
          value:     '',
          formatter: 'IngressFullPath'
        },
        {
          name:          'target',
          label:         this.t('ingress.rules.headers.target'),
          formatter:     'Link',
          formatterOpts: { options: { internal: true }, urlKey: 'targetLink.to' },
          value:         'targetLink',
        },
        {
          name:  'port',
          label: this.t('ingress.rules.headers.port'),
          value: 'port',
        },
        {
          name:      'certs',
          label:     this.t('ingress.rules.headers.certificates'),
          value:     'certs',
          formatter: 'ListLink',
        },
      ];

      if (this.value.showPathType) {
        headers.unshift({
          name:  'pathType',
          label: this.t('ingress.rules.headers.pathType'),
          value: 'pathType',
        });
      }

      return headers;
    },
    rows() {
      return this.value.createRulesForListPage(this.workloads, this.certificates);
    }
  },
  methods: {
    onAdd() {
      if (this.$refs.lastRule?.focus) {
        this.$refs.lastRule.focus();
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="isView">
    <SortableTable
      :rows="rows"
      :headers="ruleHeaders"
      key-field="_key"
      :search="false"
      :table-actions="false"
      :row-actions="false"
    />
  </div>
  <div v-else>
    <ArrayListGrouped
      v-model="value.spec.rules"
      :add-label="t('ingress.rules.addRule')"
      :default-add-value="{}"
      :mode="mode"
      @add="onAdd"
    >
      <template #default="props">
        <Rule
          ref="lastRule"
          :key="props.row.value.vKey"
          v-model="props.row.value"
          :service-targets="serviceTargets"
          :ingress="value"
          :rules="rules"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>
