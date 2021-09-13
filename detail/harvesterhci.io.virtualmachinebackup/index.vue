<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Loading from '@/components/Loading';
import CruResource from '@/components/CruResource';
import Checkbox from '@/components/form/Checkbox';
import VM_MIXIN from '@/mixins/vm';
import { allHash } from '@/utils/promise';
import CreateEditView from '@/mixins/create-edit-view';
import { HCI } from '@/config/types';

import OverviewKeypairs from '@/detail/kubevirt.io.virtualmachine/tabs/details/keypairs';
import Volume from '@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume';
import Network from '@/edit/kubevirt.io.virtualmachine/VirtualMachineNetwork';
import CloudConfig from '@/edit/kubevirt.io.virtualmachine/CloudConfig';
import OverviewBasics from '@/detail/harvesterhci.io.virtualmachinebackup/basic';

export default {
  name: 'BackupDetail',

  components: {
    Volume,
    Network,
    CruResource,
    Tabbed,
    Loading,
    Tab,
    CloudConfig,
    Checkbox,
    OverviewKeypairs,
    OverviewBasics
  },

  mixins: [CreateEditView, VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },

  data() {
    return { vm: null };
  },

  async fetch() {
    await allHash({ allImages: this.$store.dispatch('virtual/findAll', { type: HCI.IMAGE }) });

    const source = this.value.status.source;
    const vm = await this.$store.dispatch('virtual/create', {
      ...source,
      type: HCI.VM
    });

    this.vm = vm;

    const volumes = vm.spec.template?.spec?.volumes || [];

    volumes.forEach((v) => {
      if (v.cloudInitNoCloud) {
        this.userScript = v.cloudInitNoCloud.userData;
        this.networkScript = v.cloudInitNoCloud.networkData;
      }
    });

    this.spec = vm.spec;
    this.diskRows = this.getDiskRows(vm);
    this.networkRows = this.getNetworkRows(vm);
    this.imageName = this.getRootImageId(vm);
  },

  methods: {
    onTabChanged({ tab }) {
      if (tab.name === 'advanced' && this.$refs.yamlEditor?.refresh) {
        this.$refs.yamlEditor.refresh();
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :apply-hooks="applyHooks"
  >
    <Tabbed :side-tabs="true" @changed="onTabChanged">
      <Tab name="Basics" :label="t('harvester.virtualMachine.detail.tabs.basics')">
        <OverviewBasics v-if="vm" v-model="vm" mode="view" :memory="memory" />
      </Tab>

      <Tab
        name="volume"
        :label="t('harvester.tab.volume')"
        :weight="-1"
      >
        <Volume v-model="diskRows" :mode="mode" />
      </Tab>

      <Tab
        name="network"
        :label="t('harvester.tab.network')"
        :weight="-2"
      >
        <Network v-model="networkRows" :mode="mode" />
      </Tab>

      <Tab name="keypairs" :label="t('harvester.virtualMachine.detail.tabs.keypairs')" class="bordered-table" :weight="-3">
        <OverviewKeypairs v-if="vm" v-model="vm" />
      </Tab>

      <Tab
        name="advanced"
        :label="t('harvester.tab.advanced')"
        :weight="-4"
      >
        <CloudConfig ref="yamlEditor" :user-script="userScript" :mode="mode" :network-script="networkScript" @updateCloudConfig="updateCloudConfig" />

        <div class="spacer"></div>
        <Checkbox v-model="isUseMouseEnhancement" :mode="mode" class="check" type="checkbox" :label="t('harvester.virtualMachine.enableUsb')" />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
