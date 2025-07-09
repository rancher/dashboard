<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';

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

  data() {
    return { APP_UPGRADE_STATUS };
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
        v-if="row.upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE"
        class="badge-state bg-warning hand"
        @click="row.goToUpgrade(row.upgradeAvailableVersion)"
      >
        {{ row.upgradeAvailableVersion }}
        <i class="icon icon-upload" />
      </span>
      <span
        v-else-if="row.upgradeAvailable === APP_UPGRADE_STATUS.NOT_APPLICABLE"
        v-t="'catalog.app.managed'"
        class="text-muted"
      />
      <span
        v-else-if="row.upgradeAvailable === APP_UPGRADE_STATUS.NO_UPGRADE"
        class="text-muted"
      />
      <span
        v-else-if="row.upgradeAvailable === APP_UPGRADE_STATUS.MULTIPLE_UPGRADES"
      >
        <i
          v-clean-tooltip="t('catalog.app.upgrade.uncertainUpgradeWarningTooltip')"
          class="icon icon-info"
        />
      </span>
    </template>
  </PaginatedResourceTable>
</template>

<style scoped>
.apps :deep() .state-description{
  color: var(--error)
}
</style>
