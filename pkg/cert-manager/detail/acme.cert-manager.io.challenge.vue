<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Banner from '@components/Banner/Banner.vue';
import DetailSummary, { SummaryItem } from '../components/DetailSummary.vue';

const props = defineProps<{ value: any }>();

const { t } = useI18n(useStore());

const summary = computed<SummaryItem[]>(() => [
  {
    label: t('certManager.order.label'),
    value: props.value.ownerOrderName,
    to:    props.value.ownerOrderLocation,
  },
  { label: t('certManager.tableHeaders.dnsName'), value: props.value.dnsNameDisplay },
  { label: t('certManager.tableHeaders.challengeType'), value: props.value.challengeType },
  { label: t('certManager.issuer.solver.provider'), value: props.value.solverSummary },
  {
    label: t('certManager.tableHeaders.issuer'),
    value: props.value.spec?.issuerRef?.name,
    to:    props.value.issuerLocation,
  },
]);

const details = computed<SummaryItem[]>(() => [
  { label: t('certManager.challenge.presented'), value: props.value.isPresented ? t('generic.yes') : t('generic.no') },
  { label: t('certManager.challenge.processing'), value: props.value.isProcessing ? t('generic.yes') : t('generic.no') },
  { label: t('certManager.challenge.token'), value: props.value.spec?.token },
  {
    label: t('certManager.challenge.url'),
    value: props.value.spec?.url,
    href:  props.value.spec?.url,
  },
  {
    label: t('certManager.challenge.authorizationUrl'),
    value: props.value.spec?.authorizationURL,
    href:  props.value.spec?.authorizationURL,
  },
]);

// `status.reason` is where cert-manager reports why a challenge has not been accepted, so it is
// the first thing an operator needs when ACME issuance is stuck.
const reasonColor = computed(() => (props.value.state === 'error' ? 'error' : 'warning'));

const showReason = computed(() => !!props.value.status?.reason && props.value.state !== 'active');
</script>

<template>
  <div>
    <Banner
      v-if="showReason"
      :color="reasonColor"
      :label="value.status.reason"
    />

    <DetailSummary :items="summary" />

    <ResourceTabs :value="value">
      <Tab
        name="challenge-details"
        :label="t('certManager.challenge.tab.details')"
        :weight="30"
      >
        <DetailSummary
          :items="details"
          :span="4"
        />
        <h3>{{ t('certManager.challenge.key') }}</h3>
        <pre class="cert-manager-key">{{ value.spec?.key }}</pre>
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.cert-manager-key {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
