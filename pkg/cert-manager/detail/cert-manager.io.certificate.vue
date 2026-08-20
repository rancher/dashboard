<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import CertManagerResourceTabs from '../components/CertManagerResourceTabs.vue';
import IssuanceProgress from '../components/IssuanceProgress.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { CERTIFICATE_REQUEST_HEADERS } from '../table-headers';
import { useRelatedTypes } from '../composables/useRelatedTypes';
import { CERT_MANAGER } from '../types';

defineProps<{ value: any }>();

// Related resources are read from the store; a directly loaded detail page has none yet. Gate the
// related-data parts of the template on `loaded` so they render against the populated store.
const { loaded } = useRelatedTypes([CERT_MANAGER.CERTIFICATE_REQUEST, CERT_MANAGER.ORDER, CERT_MANAGER.CHALLENGE]);

const { t } = useI18n(useStore());

</script>

<template>
  <div>
    <!-- A single stage is not progress; the widget only earns its place once there is a chain -->
    <IssuanceProgress
      v-if="loaded && value.issuanceStages.length > 1"
      :stages="value.issuanceStages"
    />

    <!--
      Subject alternative names and private key settings live in the masthead rather than in tabs
      of their own: they are static spec values, and tabs are for collections. This mirrors how the
      shell shows a TLS Secret's certificate names.
    -->
    <CertManagerResourceTabs :value="value">
      <Tab
        name="issuance-history"
        :label="t('certManager.certificate.tab.issuanceHistory')"
        :weight="10"
      >
        <ResourceTable
          :rows="loaded ? value.certificateRequests : []"
          :headers="CERTIFICATE_REQUEST_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </CertManagerResourceTabs>
  </div>
</template>
