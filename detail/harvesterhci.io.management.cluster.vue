<script>
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import CopyCode from '@/components/CopyCode';
import Tab from '@/components/Tabbed/Tab';
import { allHash } from '@/utils/promise';

export default {
  components: {
    Loading,
    ResourceTabs,
    Tab,
    CopyCode,
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    await this.value.waitForProvisioner();

    const hash = { clusterToken: this.value.getOrCreateToken() };

    const res = await allHash(hash);

    this.allNodes = res.allNodes || [];
    this.allNodePools = res.allNodePools || [];
    this.clusterToken = res.clusterToken;
  },

  data() {
    return { clusterToken: null };
  },

  computed: {
    defaultTab() {
      if (this.showRegistration && !this.machines?.length) {
        return 'registration';
      }

      return '';
    },

    showRegistration() {
      if ( !this.clusterToken ) {
        return false;
      }

      if ( this.value.isImported ) {
        return !this.value.mgmt?.isReady;
      }

      return false;
    },

    registrationURL() {
      return (this.clusterToken?.command || '').replace('kubectl apply -f ', '');
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else v-model="value" :default-tab="defaultTab">
    <Tab
      v-if="showRegistration"
      name="registration"
      :label="t('cluster.tabs.registration')"
      :weight="2"
      class="p-10"
    >
      <h4>
        {{ t('cluster.harvester.registration.step1') }}
      </h4>

      <h4
        class="mt-10"
        v-html="t('cluster.harvester.registration.step2', null, true)"
      />

      <h4
        class="mt-10"
        v-html="t('cluster.harvester.registration.step3', null, true)"
      />
      <CopyCode class="m-10 p-10">
        {{ registrationURL }}
      </CopyCode>
    </Tab>
  </ResourceTabs>
</template>
