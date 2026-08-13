<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import CertManagerResourceTabs from '../components/CertManagerResourceTabs.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { CERTIFICATE_REQUEST_HEADERS } from '../table-headers';

defineProps<{ value: any }>();

const { t } = useI18n(useStore());

</script>

<template>
  <div>
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
          :rows="value.certificateRequests"
          :headers="CERTIFICATE_REQUEST_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </CertManagerResourceTabs>
  </div>
</template>
