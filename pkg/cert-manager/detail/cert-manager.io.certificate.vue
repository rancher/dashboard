<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import DetailSummary, { SummaryItem } from '../components/DetailSummary.vue';
import { CERTIFICATE_REQUEST_HEADERS } from '../table-headers';

const props = defineProps<{ value: any }>();

const { t } = useI18n(useStore());

const identifiers = computed(() => [
  { label: t('certManager.certificate.dnsNames'), values: props.value.spec?.dnsNames || [] },
  { label: t('certManager.certificate.ipAddresses'), values: props.value.spec?.ipAddresses || [] },
  { label: t('certManager.certificate.uris'), values: props.value.spec?.uris || [] },
  { label: t('certManager.certificate.emailAddresses'), values: props.value.spec?.emailAddresses || [] },
].filter((group) => group.values.length));

const privateKey = computed<SummaryItem[]>(() => [
  { label: t('certManager.certificate.privateKey.algorithm'), value: props.value.spec?.privateKey?.algorithm },
  { label: t('certManager.certificate.privateKey.size'), value: props.value.spec?.privateKey?.size },
  { label: t('certManager.certificate.privateKey.encoding'), value: props.value.spec?.privateKey?.encoding },
  { label: t('certManager.certificate.privateKey.rotationPolicy'), value: props.value.spec?.privateKey?.rotationPolicy },
]);

const failedAttempts = computed(() => props.value.status?.failedIssuanceAttempts || 0);
</script>

<template>
  <div>
    <Banner
      v-if="failedAttempts"
      color="error"
      :label="t('certManager.certificate.failedIssuance', { count: failedAttempts, time: value.status?.lastFailureTime })"
    />

    <ResourceTabs :value="value">
      <Tab
        name="subject-alternative-names"
        :label="t('certManager.certificate.tab.sans')"
        :weight="30"
      >
        <div
          v-if="!identifiers.length"
          class="text-muted"
        >
          {{ t('certManager.certificate.noIdentifiers') }}
        </div>
        <div
          v-for="group in identifiers"
          :key="group.label"
          class="mb-20"
        >
          <h3>{{ group.label }}</h3>
          <ul class="list-unstyled">
            <li
              v-for="name in group.values"
              :key="name"
            >
              {{ name }}
            </li>
          </ul>
        </div>
      </Tab>

      <Tab
        name="private-key"
        :label="t('certManager.certificate.tab.privateKey')"
        :weight="20"
      >
        <DetailSummary :items="privateKey" />
      </Tab>

      <Tab
        name="issuance-history"
        :label="t('certManager.certificate.tab.issuanceHistory')"
        :weight="10"
      >
        <ResourceTable
          :rows="value.certificateRequests"
          :headers="CERTIFICATE_REQUEST_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
