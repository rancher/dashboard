<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import DetailSummary, { SummaryItem } from '../components/DetailSummary.vue';
import { CHALLENGE_HEADERS } from '../table-headers';

const props = defineProps<{ value: any }>();

const { t } = useI18n(useStore());

const summary = computed<SummaryItem[]>(() => [
  {
    label: t('certManager.certificateRequest.label'),
    value: props.value.ownerCertificateRequestName,
    to:    props.value.ownerCertificateRequestLocation,
  },
  {
    label: t('certManager.tableHeaders.issuer'),
    value: props.value.spec?.issuerRef?.name,
    to:    props.value.issuerLocation,
  },
  { label: t('certManager.certificate.commonName'), value: props.value.spec?.commonName },
  {
    label: t('certManager.order.url'),
    value: props.value.status?.url,
    href:  props.value.status?.url,
  },
  {
    label: t('certManager.order.finalizeUrl'),
    value: props.value.status?.finalizeURL,
    href:  props.value.status?.finalizeURL,
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

    <DetailSummary :items="summary" />

    <ResourceTabs :value="value">
      <Tab
        name="authorizations"
        :label="t('certManager.order.tab.authorizations')"
        :weight="30"
      >
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
          :rows="value.challenges"
          :headers="CHALLENGE_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </ResourceTabs>
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
