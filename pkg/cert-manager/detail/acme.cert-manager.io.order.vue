<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import CertManagerResourceTabs from '../components/CertManagerResourceTabs.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import SortableTable from '@shell/components/SortableTable/index.vue';
import DetailSummary, { SummaryItem } from '../components/DetailSummary.vue';
import { CHALLENGE_HEADERS } from '../table-headers';
import { useRelatedTypes } from '../composables/useRelatedTypes';
import { CERT_MANAGER } from '../types';

const props = defineProps<{ value: any }>();

// Related resources are read from the store; a directly loaded detail page has none yet. Gate the
// related-data parts of the template on `loaded` so they render against the populated store.
const { loaded } = useRelatedTypes([CERT_MANAGER.CHALLENGE]);

const { t } = useI18n(useStore());

// Too long for the masthead, so they live with the authorizations they belong to
const acmeUrls = computed<SummaryItem[]>(() => [
  {
    label: t('certManager.order.url'), value: props.value.status?.url, href: props.value.status?.url
  },
  {
    label: t('certManager.order.finalizeUrl'), value: props.value.status?.finalizeURL, href: props.value.status?.finalizeURL
  },
]);

// Authorizations are derived summaries rather than store resources, so the identifier link is
// rendered through the cell slot below.
const authorizationHeaders = computed(() => [
  {
    name: 'identifier', labelKey: 'certManager.order.identifier', value: 'identifier', sort: ['identifier'],
  },
  {
    name: 'wildcard', labelKey: 'certManager.order.wildcard', value: (row: any) => (row.wildcard ? t('generic.yes') : t('generic.no')), sort: ['wildcard'],
  },
  {
    name: 'challengeTypes', labelKey: 'certManager.order.challengeTypes', value: (row: any) => (row.challengeTypes || []).join(', '),
  },
]);

</script>

<template>
  <div>
    <Banner
      v-if="value.status?.reason"
      :color="value.state === 'error' ? 'error' : 'info'"
      :label="value.status.reason"
    />

    <CertManagerResourceTabs :value="value">
      <Tab
        name="authorizations"
        :label="t('certManager.order.tab.authorizations')"
        :weight="30"
      >
        <DetailSummary :items="acmeUrls" />

        <SortableTable
          v-if="value.authorizationSummaries.length"
          :rows="value.authorizationSummaries"
          :headers="authorizationHeaders"
          key-field="identifier"
          default-sort-by="identifier"
          :table-actions="false"
          :row-actions="false"
          :search="false"
          :paging="false"
        >
          <template #cell:identifier="{ row }">
            <a
              v-if="row.url"
              :href="row.url"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ row.identifier }}</a>
            <span v-else>{{ row.identifier }}</span>
          </template>
        </SortableTable>
        <div
          v-else
          class="text-muted"
        >
          {{ t('certManager.order.noAuthorizations') }}
        </div>
      </Tab>

      <Tab
        name="challenges"
        :label="t('certManager.order.tab.challenges')"
        :weight="20"
      >
        <ResourceTable
          :rows="loaded ? value.challenges : []"
          :headers="CHALLENGE_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </CertManagerResourceTabs>
  </div>
</template>
