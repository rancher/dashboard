<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { EVENT, HCI } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import BackupModal from '@/list/kubevirt.io.virtualmachine/backupModal';
import RestoreModal from '@/list/kubevirt.io.virtualmachine/restoreModal';
import MigrationModal from '@/list/kubevirt.io.virtualmachine/MigrationModal';
import OverviewBasics from './tabs/details/basics';
import OverviewDisks from './tabs/details/disks';
import OverviewNetworks from './tabs/details/networks';
import OverviewKeypairs from './tabs/details/keypairs';
import OverviewCloudConfigs from './tabs/details/cloud-configs';
import Migration from './tabs/migration';
import Events from './tabs/events/';

export default {
  name: 'VMIDetailsPage',

  components: {
    Tab,
    Tabbed,
    Events,
    OverviewBasics,
    OverviewDisks,
    OverviewNetworks,
    OverviewKeypairs,
    OverviewCloudConfigs,
    Migration,
    BackupModal,
    RestoreModal,
    MigrationModal
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  fetch() {
    this.getEvents();
  },

  data() {
    return { switchToCloud: false };
  },

  computed: {
    vmi() {
      const vmiList = this.$store.getters['cluster/all'](HCI.VMI) || [];
      const vmi = vmiList.find( (VMI) => {
        return VMI?.metadata?.ownerReferences?.[0]?.uid === this.value?.metadata?.uid;
      });

      return vmi;
    },
    allEvents() {
      return this.$store.getters['cluster/all'](EVENT);
    },
    events() {
      return this.allEvents.filter((e) => {
        const { name, creationTimestamp } = this.value?.metadata || {};
        const podName = this.value.podResource?.metadata?.name;
        const involvedName = e?.involvedObject?.name;

        return (involvedName === name || involvedName === podName) && e.firstTimestamp >= creationTimestamp;
      }).sort((a, b) => {
        if (a.lastTimestamp > b.lastTimestamp) {
          return -1;
        }

        return 1;
      });
    },
  },

  methods: {
    getEvents() {
      this.$store.dispatch('cluster/findAll', { type: EVENT });
    },

    tabChanged({ tab = {} }) {
      this.switchToCloud = tab.name === 'cloudConfig';
    },
  }
};
</script>

<template>
  <div>
    <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true" @changed="tabChanged">
      <Tab name="basics" :label="t('harvester.virtualMachine.detail.tabs.basics')" class="bordered-table" :weight="7">
        <OverviewBasics v-model="value" :resource="vmi" mode="view" />
      </Tab>

      <Tab name="disks" :label="t('harvester.tab.volume')" class="bordered-table" :weight="5">
        <OverviewDisks v-model="value" />
      </Tab>

      <Tab name="networks" :label="t('harvester.virtualMachine.detail.tabs.networks')" class="bordered-table" :weight="4">
        <OverviewNetworks v-model="value" />
      </Tab>

      <Tab name="keypairs" :label="t('harvester.virtualMachine.detail.tabs.keypairs')" class="bordered-table" :weight="3">
        <OverviewKeypairs v-model="value" />
      </Tab>

      <Tab name="cloudConfig" :label="t('harvester.virtualMachine.detail.tabs.cloudConfig')" class="bordered-table" :weight="2">
        <OverviewCloudConfigs v-model="value" :active="switchToCloud" />
      </Tab>

      <Tab name="event" :label="t('harvester.virtualMachine.detail.tabs.events')" :weight="1">
        <Events :resource="vmi" :events="events" />
      </Tab>

      <Tab name="migration" :label="t('harvester.virtualMachine.detail.tabs.migration')">
        <Migration v-model="value" :vmi-resource="vmi" />
      </Tab>
    </Tabbed>

    <BackupModal />
    <RestoreModal />
    <MigrationModal />
  </div>
</template>
