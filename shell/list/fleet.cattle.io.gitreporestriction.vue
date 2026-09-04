<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import FleetMigrationGuideLink from '@shell/components/fleet/FleetMigrationGuideLink.vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { FLEET } from '@shell/config/types';
import { NAME as FLEET_PRODUCT } from '@shell/config/product/fleet';
import { BLANK_CLUSTER } from '@shell/store/store-types';

withDefaults(defineProps<{
  schema: Record<string, any>;
  useQueryParamsForSimpleFiltering?: boolean;
}>(), { useQueryParamsForSimpleFiltering: false });

const store = useStore();

// In-app link to the new Fleet Policies list (the successor to GitRepoRestriction).
const policiesLocation = {
  name:   'c-cluster-product-resource',
  params: {
    cluster: BLANK_CLUSTER, product: FLEET_PRODUCT, resource: FLEET.POLICY
  },
};

// The Policies list is only reachable where Fleet serves the Policy type (the nav entry is schema
// gated too), so fall back to plain text rather than linking to a resource-not-found page.
const hasPolicySchema = computed(() => !!store.getters['management/schemaFor'](FLEET.POLICY));
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
            <router-link
              v-if="hasPolicySchema"
              :to="policiesLocation"
            >
              {{ content }}
            </router-link>
            <template v-else>
              {{ content }}
            </template>
          </template>
        </RichTranslation>
        <FleetMigrationGuideLink
          data-testid="git-repo-restriction-migration-guide"
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
