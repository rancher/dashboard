<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import CopyToClipboard from '@shell/components/CopyToClipboard.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import DetailSummary, { SummaryItem } from '../components/DetailSummary.vue';
import { ORDER_HEADERS } from '../table-headers';

const props = defineProps<{ value: any }>();

const { t } = useI18n(useStore());

const csr = computed(() => props.value.csrInfo);

const csrSummary = computed<SummaryItem[]>(() => [
  { label: t('certManager.certificateRequest.subject'), value: csr.value?.subject },
  { label: t('certManager.certificateRequest.signatureAlgorithm'), value: csr.value?.signatureAlgorithm },
]);

const csrIdentifiers = computed(() => [
  { label: t('certManager.certificate.dnsNames'), values: csr.value?.dnsNames || [] },
  { label: t('certManager.certificate.ipAddresses'), values: csr.value?.ipAddresses || [] },
  { label: t('certManager.certificate.uris'), values: csr.value?.uris || [] },
  { label: t('certManager.certificate.emailAddresses'), values: csr.value?.emailAddresses || [] },
].filter((group) => group.values.length));
</script>

<template>
  <div>
    <Banner
      v-if="value.isDenied"
      color="error"
      :label="value.deniedCondition?.message || t('certManager.certificateRequest.denied')"
    />

    <ResourceTabs :value="value">
      <Tab
        name="csr"
        :label="t('certManager.certificateRequest.tab.csr')"
        :weight="30"
      >
        <Banner
          v-if="!csr"
          color="warning"
          :label="t('certManager.certificateRequest.csrUnreadable')"
        />
        <template v-else>
          <DetailSummary
            :items="csrSummary"
          />
          <div
            v-for="group in csrIdentifiers"
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
          <div class="cert-manager-pem-header">
            <h3>{{ t('certManager.certificateRequest.pem') }}</h3>
            <CopyToClipboard :text="csr.pem" />
          </div>
          <pre class="cert-manager-pem">{{ csr.pem }}</pre>
        </template>
      </Tab>

      <Tab
        name="orders"
        :label="t('certManager.certificateRequest.tab.orders')"
        :weight="20"
      >
        <ResourceTable
          :rows="value.orders"
          :headers="ORDER_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.cert-manager-pem-header {
  align-items: center;
  display: flex;
  gap: 10px;
}

.cert-manager-pem {
  max-height: 300px;
  overflow: auto;
}
</style>
