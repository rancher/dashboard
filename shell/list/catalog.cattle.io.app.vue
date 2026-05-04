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
      <div
        v-if="row.upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE"
        v-clean-tooltip="row.upgradeAvailableVersion"
        class="badge-state bg-warning hand app-upgrade-badge"
        @click="row.goToUpgrade(row.upgradeAvailableVersion)"
      >
        <div>{{ row.upgradeAvailableVersion }}</div>
        <i class="icon icon-upload" />
      </div>
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

<style scoped lang="scss">
.apps :deep() .state-description{
  color: var(--error)
}

.badge-state.app-upgrade-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--border-radius);
  padding: 2px 4px;

  > div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  > .icon {
    flex-shrink: 0;
  }
}

</style>
