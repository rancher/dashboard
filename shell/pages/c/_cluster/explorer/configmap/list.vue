<script>
import ClusterExplorer from '@shell/components/templates/ClusterExplorer';
import ResourceList from '@shell/components/ResourceList';
import { NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, KEYS } from '@shell/config/table-headers';
import { CONFIG_MAP } from '@shell/config/types';

export default {
  components: { ClusterExplorer, ResourceList },

  data() {
    return { headers: [NAME_COL, NAMESPACE_COL, KEYS, AGE], rows: [] };
  },

  methods: {
    async load() {
      this.rows = await this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP });
    }
  },
};
</script>
<template>
  <ClusterExplorer @clusterReady="load">
    <ResourceList
      :title="t('typeLabel.configmap', {count: 2})"
      :headers="headers"
      :rows="rows"
    />
  </ClusterExplorer>
</template>
