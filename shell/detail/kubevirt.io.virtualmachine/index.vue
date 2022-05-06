<script>
import { mapGetters } from 'vuex';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { EVENT, HCI, SERVICE, POD } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import VM_MIXIN from '@shell/mixins/harvester-vm';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { allHash } from '@shell/utils/promise';
import { allDashboardsExist } from '@shell/utils/grafana';

import CloudConfig from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachineCloudConfig';
import Volume from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachineVolume';
import Network from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachineNetwork';
import AccessCredentials from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachineAccessCredentials';
import Events from './VirtualMachineTabs/VirtualMachineEvents';
import Migration from './VirtualMachineTabs/VirtualMachineMigration';
import OverviewBasics from './VirtualMachineTabs/VirtualMachineBasics';
import OverviewKeypairs from './VirtualMachineTabs/VirtualMachineKeypairs';

const VM_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/harvester-vm-detail-1/vm-info-detail?orgId=1';

export default {
  name: 'VMIDetailsPage',

  components: {
    Tab,
    Tabbed,
    Events,
    OverviewBasics,
    Volume,
    Network,
    OverviewKeypairs,
    CloudConfig,
    Migration,
    DashboardMetrics,
    AccessCredentials,
  },

  mixins: [CreateEditView, VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      switchToCloud: false,
      VM_METRICS_DETAIL_URL,
      showVmMetrics: false,
    };
  },

  async created() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = {
      pods:     this.$store.dispatch(`${ inStore }/findAll`, { type: POD }),
      services: this.$store.dispatch(`${ inStore }/findAll`, { type: SERVICE }),
      events:   this.$store.dispatch(`${ inStore }/findAll`, { type: EVENT }),
      allSSHs:  this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.SSH }),
      vmis:     this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.VMI }),
      restore:  this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.RESTORE }),
    };

    await allHash(hash);

    this.showVmMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [VM_METRICS_DETAIL_URL], 'harvester');
  },

  computed: {
    ...mapGetters(['currentCluster']),

    vmi() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      const vmiList = this.$store.getters[`${ inStore }/all`](HCI.VMI) || [];
      const vmi = vmiList.find( (VMI) => {
        return VMI?.metadata?.ownerReferences?.[0]?.uid === this.value?.metadata?.uid;
      });

      return vmi;
    },

    allEvents() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/all`](EVENT);
    },

    events() {
      return this.allEvents.filter((e) => {
        const { name, creationTimestamp } = this.value?.metadata || {};
        const podName = this.value.podResource?.metadata?.name;
        const pvcName = this.value.persistentVolumeClaimName || [];

        const involvedName = e?.involvedObject?.name;

        const matchPVC = pvcName.find(name => name === involvedName);

        return (involvedName === name || involvedName === podName || matchPVC) && e.firstTimestamp >= creationTimestamp;
      }).sort((a, b) => {
        if (a.lastTimestamp > b.lastTimestamp) {
          return -1;
        }

        return 1;
      });
    },

    graphVars() {
      return {
        namespace: this.value.namespace,
        vm:        this.value.name
      };
    },

    hasMetrics() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return !!this.$store.getters[`${ inStore }/byId`]('service', 'cattle-monitoring-system/rancher-monitoring-grafana');
    },
  },

  methods: {
    onTabChanged({ tab }) {
      if (tab.name === 'cloudConfig') {
        this.$refs.yamlEditor?.refresh();
      }
    },
  },

  watch: {
    value: {
      handler(neu) {
        const diskRows = this.getDiskRows(neu);

        this.$set(this, 'diskRows', diskRows);
      },
      deep: true
    }
  }
};
</script>

<template>
  <div>
    <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true" @changed="onTabChanged">
      <Tab name="basics" :label="t('harvester.virtualMachine.detail.tabs.basics')" class="bordered-table" :weight="7">
        <OverviewBasics v-model="value" :resource="vmi" mode="view" />
      </Tab>

      <Tab name="disks" :label="t('harvester.tab.volume')" class="bordered-table" :weight="6">
        <Volume
          v-model="diskRows"
          mode="view"
          :namespace="value.metadata.namespace"
          :vm="value"
          :resource-type="value.type"
        />
      </Tab>

      <Tab name="networks" :label="t('harvester.virtualMachine.detail.tabs.networks')" class="bordered-table" :weight="5">
        <Network v-model="networkRows" mode="view" />
      </Tab>

      <Tab name="keypairs" :label="t('harvester.virtualMachine.detail.tabs.keypairs')" class="bordered-table" :weight="3">
        <OverviewKeypairs v-model="value" />
      </Tab>

      <Tab
        v-if="showVmMetrics"
        name="vm-metrics"
        :label="t('harvester.virtualMachine.detail.tabs.metrics')"
        :weight="2.5"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="VM_METRICS_DETAIL_URL"
            graph-height="550px"
            :has-summary-and-detail="false"
            :vars="graphVars"
          />
        </template>
      </Tab>

      <Tab :label="t('harvester.tab.accessCredentials')" class="bordered-table" name="accessCredentials" :weight="2.2">
        <AccessCredentials mode="view" :value="accessCredentials" :resource="value" />
      </Tab>

      <Tab name="cloudConfig" :label="t('harvester.virtualMachine.detail.tabs.cloudConfig')" class="bordered-table" :weight="2">
        <CloudConfig
          ref="yamlEditor"
          mode="view"
          :user-script="userScript"
          :network-script="networkScript"
        />
      </Tab>

      <Tab name="event" :label="t('harvester.virtualMachine.detail.tabs.events')" :weight="1">
        <Events :resource="vmi" :events="events" />
      </Tab>

      <Tab name="migration" :label="t('harvester.virtualMachine.detail.tabs.migration')">
        <Migration v-model="value" :vmi-resource="vmi" />
      </Tab>
    </Tabbed>
  </div>
</template>
