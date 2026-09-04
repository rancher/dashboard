<script setup lang="ts">
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { useI18n } from '@shell/composables/useI18n';
import { FLEET } from '@shell/config/types';
import { getGitRepoRestrictionMigrationDocsUrl } from '@shell/utils/fleet-docs';

withDefaults(defineProps<{
  schema: Record<string, any>;
  useQueryParamsForSimpleFiltering?: boolean;
}>(), { useQueryParamsForSimpleFiltering: false });

const store = useStore();
const { t } = useI18n(store);

// In-app link to the new Fleet Policies list (the successor to GitRepoRestriction). Fleet management
// resources live under the blank ("_") cluster context, e.g. /c/_/fleet/fleet.cattle.io.policy.
const policiesLocation = {
  name:   'c-cluster-product-resource',
  params: {
    cluster: '_', product: 'fleet', resource: FLEET.POLICY
  },
};
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
        <RichTranslation
          k="fleet.gitRepoRestriction.deprecationWarning"
          tag="div"
        >
          <template #policiesLink="{ content }">
            <router-link :to="policiesLocation">
              {{ content }}
            </router-link>
          </template>
        </RichTranslation>
        <RichTranslation
          k="fleet.gitRepoRestriction.migrationGuide"
          tag="div"
          data-testid="git-repo-restriction-migration-guide"
          class="mt-5"
        >
          <template #docsLink="{ content }">
            <a
              :href="getGitRepoRestrictionMigrationDocsUrl()"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="migration-guide-link"
            >{{ content }} <i class="icon icon-external-link" /></a><span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
          </template>
        </RichTranslation>
      </div>
    </Banner>
    <PaginatedResourceTable
      :schema="schema"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>

<style lang="scss" scoped>
// The base .icon is inline-block; make the external-link icon inline so it sits on the text baseline.
.migration-guide-link .icon {
  display: inline;
}
</style>
