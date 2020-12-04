<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { CATALOG } from '@/config/types';
import { allHash } from '@/utils/promise';
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
    const hash = await allHash({
      rows: this.$store.dispatch('cluster/findAll', { type: this.resource }),
      app:  this.$store.dispatch('cluster/find', {
        type: CATALOG.APP,
        id:   `cis-operator-system/rancher-cis-benchmark`,
      })
    });

    this.rows = hash.rows;
    this.app = hash.app;
  },

  data() {
    return { rows: null, app: null };
  },

  computed: {
    hasWarningState() {
      if (!this.app) {
        return false;
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
