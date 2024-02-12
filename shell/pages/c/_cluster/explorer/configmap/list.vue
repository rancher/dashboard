<script>
import ResourceList from '@shell/components/ResourceList';
import { NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, KEYS } from '@shell/config/table-headers';
import { CONFIG_MAP } from '@shell/config/types';

export default {
  components: { ResourceList },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP });
  },

  data() {
    return { headers: [NAME_COL, NAMESPACE_COL, KEYS, AGE], rows: [] };
  },
};
</script>
<template>
  <ResourceList
    :title="t('typeLabel.configmap', {count: 2})"
    :headers="headers"
    :rows="rows"
  />
</template>
