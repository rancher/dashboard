<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import DetailSummary, { SummaryItem } from './DetailSummary.vue';
import { CERTIFICATE_HEADERS } from '../table-headers';

const props = defineProps<{ value: any }>();

const { t } = useI18n(useStore());

const isAcme = computed(() => props.value.configType === 'acme');

const summary = computed<SummaryItem[]>(() => {
  const items: SummaryItem[] = [{ label: t('certManager.tableHeaders.type'), value: props.value.configTypeDisplay }];

  if (isAcme.value) {
    items.push(
      {
        label: t('certManager.issuer.acme.server'),
        value: props.value.acmeServerDisplay,
        href:  props.value.acmeServer,
      },
      { label: t('certManager.issuer.acme.email'), value: props.value.acmeRegisteredEmail || props.value.spec?.acme?.email },
      {
        label: t('certManager.issuer.acme.accountUri'),
        value: props.value.acmeAccountUri,
        href:  props.value.acmeAccountUri,
      },
    );
  }

  if (props.value.configType === 'ca') {
    items.push({
      label: t('certManager.issuer.ca.secretName'),
      value: props.value.spec?.ca?.secretName,
      to:    props.value.caSecretLocation,
    });
  }

  if (props.value.configType === 'vault') {
    items.push(
      { label: t('certManager.issuer.vault.server'), value: props.value.spec?.vault?.server },
      { label: t('certManager.issuer.vault.path'), value: props.value.spec?.vault?.path },
    );
  }

  return items;
});
</script>

<template>
  <div>
    <DetailSummary :items="summary" />

    <ResourceTabs :value="value">
      <Tab
        v-if="isAcme"
        name="solvers"
        :label="t('certManager.issuer.tab.solvers')"
        :weight="30"
      >
        <table
          v-if="value.solverSummaries.length"
          class="cert-manager-solvers"
        >
          <thead>
            <tr>
              <th>{{ t('certManager.issuer.solver.challengeType') }}</th>
              <th>{{ t('certManager.issuer.solver.provider') }}</th>
              <th>{{ t('certManager.issuer.solver.selector') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(solver, i) in value.solverSummaries"
              :key="i"
            >
              <td>{{ solver.type }}</td>
              <td>{{ solver.provider || '&mdash;' }}</td>
              <td>
                <span v-if="solver.selector.length">{{ solver.selector.join(', ') }}</span>
                <span
                  v-else
                  class="text-muted"
                >{{ t('certManager.issuer.solver.catchAll') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-else
          class="text-muted"
        >
          {{ t('certManager.issuer.solver.none') }}
        </div>
      </Tab>

      <Tab
        name="certificates"
        :label="t('certManager.issuer.tab.certificates')"
        :weight="20"
      >
        <ResourceTable
          :rows="value.certificates"
          :headers="CERTIFICATE_HEADERS"
          :table-actions="false"
          :groupable="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.cert-manager-solvers {
  width: 100%;
  text-align: left;

  th, td {
    padding: 8px 8px 8px 0;
    border-bottom: 1px solid var(--border);
  }
}
</style>
