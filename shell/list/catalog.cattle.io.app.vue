<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListApps',
  components: { ResourceTable },
  mixins:     [ResourceFetch],

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    await this.$fetchType(this.resource);
  },
};
</script>

<template>
  <ResourceTable
    class="apps"
    :schema="schema"
    :rows="rows"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  >
    <template #cell:upgrade="{row}">
      <span
        v-if="row.upgradeAvailable"
        class="badge-state bg-warning hand"
        @click="row.goToUpgrade(row.upgradeAvailable)"
      >
        {{ row.upgradeAvailable }}
        <i class="icon icon-upload" />
      </span>
      <span
        v-else-if="row.upgradeAvailable === false"
        v-t="'catalog.app.managed'"
        class="text-muted"
      />
    </template>
  </ResourceTable>
</template>

<style scoped>
.apps ::v-deep .state-description{
  color: var(--error)
}
</style>
