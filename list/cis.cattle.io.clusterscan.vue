<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { CATALOG } from '@/config/types';
import { get } from '@/utils/object';
const semver = require('semver');

export default {
  components: { Loading, ResourceTable },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
    try {
      this.app = await this.$store.dispatch('cluster/find', {
        type: CATALOG.APP,
        id:   `cis-operator-system/rancher-cis-benchmark`,
      });
    } catch {}
  },

  data() {
    return { rows: null, app: null };
  },

  computed: {
    hasWarningState() {
      if (!this.app) {
        return true;
      }
      const version = get(this.app, 'spec.chart.metadata.version');

      if (!version) {
        return;
      }

      return semver.satisfies(version, '>=1.0.300');
    },

    headers() {
      const headersFromSchema = this.$store.getters['type-map/headersFor'](this.schema);

      if (!this.hasWarningState) {
        return headersFromSchema.filter(header => header.name !== 'warn');
      } else {
        return headersFromSchema;
      }
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" :headers="headers" />
</template>
