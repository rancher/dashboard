<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import CertManagerResourceTabs from '../components/CertManagerResourceTabs.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
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

        <table
          v-if="value.authorizationSummaries.length"
          class="cert-manager-table"
        >
          <thead>
            <tr>
              <th>{{ t('certManager.order.identifier') }}</th>
              <th>{{ t('certManager.order.wildcard') }}</th>
              <th>{{ t('certManager.order.challengeTypes') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(auth, i) in value.authorizationSummaries"
              :key="i"
            >
              <td>
                <a
                  v-if="auth.url"
                  :href="auth.url"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >{{ auth.identifier }}</a>
                <span v-else>{{ auth.identifier }}</span>
              </td>
              <td>{{ auth.wildcard ? t('generic.yes') : t('generic.no') }}</td>
              <td>{{ auth.challengeTypes.join(', ') }}</td>
            </tr>
          </tbody>
        </table>
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

<style lang="scss" scoped>
.cert-manager-table {
  width: 100%;
  text-align: left;

  th, td {
    padding: 8px 8px 8px 0;
    border-bottom: 1px solid var(--border);
  }
}
</style>
