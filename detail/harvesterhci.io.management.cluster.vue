<script>
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import CopyCode from '@/components/CopyCode';
import Tab from '@/components/Tabbed/Tab';
import { allHash } from '@/utils/promise';
import CustomCommand from '@/edit/provisioning.cattle.io.cluster/CustomCommand';

export default {
  components: {
    Loading,
    ResourceTabs,
    Tab,
    CopyCode,
    CustomCommand,
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
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else v-model="value" :default-tab="defaultTab">
    <Tab v-if="showRegistration" name="registration" label="Registration" :weight="2">
      <CustomCommand v-if="value.isCustom" :cluster-token="clusterToken" />
      <template v-else>
        <h4 v-html="t('cluster.import.commandInstructions', null, true)" />
        <CopyCode class="m-10 p-10">
          {{ clusterToken.command }}
        </CopyCode>

        <h4 class="mt-10" v-html="t('cluster.import.commandInstructionsInsecure', null, true)" />
        <CopyCode class="m-10 p-10">
          {{ clusterToken.insecureCommand }}
        </CopyCode>

        <h4 class="mt-10" v-html="t('cluster.import.clusterRoleBindingInstructions', null, true)" />
        <CopyCode class="m-10 p-10">
          {{ t('cluster.import.clusterRoleBindingCommand', null, true) }}
        </CopyCode>
      </template>
    </Tab>
  </ResourceTabs>
</template>
