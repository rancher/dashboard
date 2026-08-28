<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import { useDefaultMastheadProps } from '@shell/components/Resource/Detail/Masthead/composable';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import CertManagerResourceTabs from '../components/CertManagerResourceTabs.vue';
import { CERTIFICATE_REQUEST_HEADERS } from '../table-headers';
import { useRelatedTypes } from '../composables/useRelatedTypes';
import { CERT_MANAGER } from '../types';

const props = defineProps<{ value: any }>();

// Related resources are read from the store; a directly loaded detail page has none yet. Gate the
// related-data parts of the template on `loaded` so they render against the populated store. The
// masthead cards read the model reactively, so they fill in on their own once the store is loaded.
const { loaded } = useRelatedTypes([CERT_MANAGER.CERTIFICATE_REQUEST, CERT_MANAGER.ORDER, CERT_MANAGER.CHALLENGE]);

const { t } = useI18n(useStore());

// The masthead renders the title bar (with the Renew action and Show Configuration), the
// identifying information from the model's `details`, and the card row from the model's `cards` -
// Issuance Status, Resources and Insights.
const mastheadProps = useDefaultMastheadProps(props.value);
</script>

<template>
  <DetailPage>
    <template #top-area>
      <Masthead v-bind="mastheadProps" />
    </template>

    <!--
      Subject alternative names and private key settings live in the masthead rather than in tabs
      of their own: they are static spec values, and tabs are for collections. This mirrors how the
      shell shows a TLS Secret's certificate names.
    -->
    <template #bottom-area>
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
    </template>
  </DetailPage>
</template>
