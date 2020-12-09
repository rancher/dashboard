<script>
import { WORKLOAD_TYPES } from '@/config/types';
import Loading from '@/components/Loading';
import SortableTable from '@/components/SortableTable';
import { _VIEW } from '@/config/query-params';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
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
  },

  async fetch() {
    await Promise.all(Object.values(WORKLOAD_TYPES).map(type => this.$store.dispatch('cluster/findAll', { type })));
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
          name:       'certs',
          label:      this.t('ingress.rules.headers.certificates'),
          value:      'certs',
          formatter: 'ListLink',
        },
      ];

      if (this.value.showPathType) {
        headers.unshift({
          name:      'pathType',
          label:     this.t('ingress.rules.headers.pathType'),
          value:     'pathType',
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
    <ArrayListGrouped v-model="value.spec.rules" :add-label="t('ingress.rules.addRule')" :default-add-value="{}" @add="onAdd">
      <template #default="props">
        <Rule
          ref="lastRule"
          v-model="props.row.value"
          :service-targets="serviceTargets"
          :ingress="value"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>
