<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { CERTIFICATE_REQUEST_HEADERS } from '../table-headers';

const props = defineProps<{ value: any }>();

const { t } = useI18n(useStore());

const failedAttempts = computed(() => props.value.status?.failedIssuanceAttempts || 0);
</script>

<template>
  <div>
    <Banner
      v-if="failedAttempts"
      color="error"
      :label="t('certManager.certificate.failedIssuance', { count: failedAttempts, time: value.status?.lastFailureTime })"
    />

    <!--
      Subject alternative names and private key settings live in the masthead rather than in tabs
      of their own: they are static spec values, and tabs are for collections. This mirrors how the
      shell shows a TLS Secret's certificate names.
    -->
    <ResourceTabs :value="value">
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
