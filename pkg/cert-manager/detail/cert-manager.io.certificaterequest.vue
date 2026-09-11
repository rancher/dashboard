<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import CertManagerResourceTabs from '../components/CertManagerResourceTabs.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import DetailText from '@shell/components/DetailText.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import DetailSummary, { SummaryItem } from '../components/DetailSummary.vue';
import { ORDER_HEADERS } from '../table-headers';
import { useRelatedTypes } from '../composables/useRelatedTypes';
import { CERT_MANAGER } from '../types';

const props = defineProps<{ value: any }>();

// Related resources are read from the store; a directly loaded detail page has none yet. Gate the
// related-data parts of the template on `loaded` so they render against the populated store.
const { loaded } = useRelatedTypes([CERT_MANAGER.ORDER, CERT_MANAGER.CHALLENGE]);

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

    <CertManagerResourceTabs :value="value">
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
            class="mmb-5"
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
          <!-- Same treatment the shell gives certificate data on a Secret: monospace, copyable,
               truncated with an expand affordance -->
          <DetailText
            :value="csr.pem"
            label-key="certManager.certificateRequest.pem"
          />
        </template>
      </Tab>

      <Tab
        name="orders"
        :label="t('certManager.certificateRequest.tab.orders')"
        :weight="20"
      >
        <ResourceTable
          :rows="loaded ? value.orders : []"
          :headers="ORDER_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </CertManagerResourceTabs>
  </div>
</template>
