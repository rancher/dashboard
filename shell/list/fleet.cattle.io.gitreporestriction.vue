<script setup lang="ts">
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { useI18n } from '@shell/composables/useI18n';

withDefaults(defineProps<{
  schema: Record<string, any>;
  useQueryParamsForSimpleFiltering?: boolean;
}>(), { useQueryParamsForSimpleFiltering: false });

const store = useStore();
const { t } = useI18n(store);

const deprecationWarning = t(
  'fleet.gitRepoRestriction.deprecationWarning',
  { url: t('fleet.gitRepoRestriction.migrationDocsUrl') },
  true,
);
</script>

<template>
  <div>
    <Banner
      color="warning"
      data-testid="git-repo-restriction-deprecation-banner"
    >
      <span v-clean-html="deprecationWarning" />
    </Banner>
    <PaginatedResourceTable
      :schema="schema"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>
