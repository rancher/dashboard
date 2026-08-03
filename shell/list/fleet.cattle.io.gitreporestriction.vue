<script setup lang="ts">
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { useI18n } from '@shell/composables/useI18n';
import { getVersionData } from '@shell/config/version';
import { getContinuousDeliveryPoliciesDocsUrl, getGitRepoRestrictionMigrationDocsUrl } from '@shell/utils/fleet-docs';

withDefaults(defineProps<{
  schema: Record<string, any>;
  useQueryParamsForSimpleFiltering?: boolean;
}>(), { useQueryParamsForSimpleFiltering: false });

const store = useStore();
const { t } = useI18n(store);

const rancherVersion = getVersionData()?.Version;

// Version-aware link to the Fleet docs section on migrating from GitRepoRestriction.
const deprecationWarning = t(
  'fleet.gitRepoRestriction.deprecationWarning',
  { url: getGitRepoRestrictionMigrationDocsUrl(rancherVersion) },
  true,
);

// Version-aware link to the Fleet "Policy" reference docs (the successor to GitRepoRestriction).
const learnMorePolicies = t(
  'fleet.gitRepoRestriction.learnMorePolicies',
  { url: getContinuousDeliveryPoliciesDocsUrl(rancherVersion) },
  true,
);
</script>

<template>
  <div>
    <Banner
      color="warning"
      data-testid="git-repo-restriction-deprecation-banner"
    >
      <!-- Single wrapper so the Banner's flex row treats this as one item and the
           two lines stack vertically rather than sitting side by side. -->
      <div>
        <div v-clean-html="deprecationWarning" />
        <div
          v-clean-html="learnMorePolicies"
          data-testid="git-repo-restriction-learn-more-policies"
          class="mt-5"
        />
      </div>
    </Banner>
    <PaginatedResourceTable
      :schema="schema"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>
