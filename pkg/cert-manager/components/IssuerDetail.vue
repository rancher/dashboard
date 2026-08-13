<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import CertManagerResourceTabs from './CertManagerResourceTabs.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { CERTIFICATE_HEADERS } from '../table-headers';

const props = defineProps<{ value: any }>();

const { t } = useI18n(useStore());

const isAcme = computed(() => props.value.configType === 'acme');

</script>

<template>
  <div>
    <CertManagerResourceTabs :value="value">
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
    </CertManagerResourceTabs>
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
