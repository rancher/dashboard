<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';

export default {
  name:       'ListApps',
  components: { PaginatedResourceTable },

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
  },
};
</script>

<template>
  <PaginatedResourceTable
    class="apps"
    :schema="schema"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    data-testid="installed-app-catalog-list"
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
  </PaginatedResourceTable>
</template>

<style scoped>
.apps :deep() .state-description{
  color: var(--error)
}
</style>
