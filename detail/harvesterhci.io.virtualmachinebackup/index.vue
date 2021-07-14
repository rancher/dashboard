<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import Checkbox from '@/components/form/Checkbox';
import VM_MIXIN from '@/mixins/vm';
import { allHash } from '@/utils/promise';
import CreateEditView from '@/mixins/create-edit-view';
import { HCI } from '@/config/types';

import OverviewKeypairs from '@/detail/harvesterhci.io.virtualmachinebackup/keypairs';
import Volume from '@/edit/kubevirt.io.virtualmachine/volume';
import Network from '@/edit/kubevirt.io.virtualmachine/network';
import CloudConfig from '@/edit/kubevirt.io.virtualmachine/CloudConfig';
import OverviewBasics from '@/detail/harvesterhci.io.virtualmachinebackup/basic';

export default {
  name: 'BackupDetail',

  components: {
    Volume,
    Network,
    CruResource,
    Tabbed,
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

  async fetch() {
    const hash = await allHash({ backupContents: this.$store.dispatch('virtual/findAll', { type: HCI.BACKUP_CONTENT }) });

    const content = hash.backupContents.find( O => O.id === `default/${ this.value?.backupContentName }`);

    const spec = content.spec.source.virtualMachineSpec;

    this.backupContents = hash.backupContents;
    this.spec = spec;
    this.contentResource = content;

    const volumes = spec.template?.spec?.volumes || [];

    volumes.forEach((v) => {
      if (v.cloudInitNoCloud) {
        this.userScript = v.cloudInitNoCloud.userData;
        this.networkScript = v.cloudInitNoCloud.networkData;
      }
    });

    this.diskRows = this.getDiskRows(spec);
    this.networkRows = this.getNetworkRows(spec);
    this.imageName = this.getRootImage(spec);
  },

  data() {
    return {
      backupContents:  [],
      contentResource: null
    };
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
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    @apply-hooks="applyHooks"
  >
    <Tabbed :side-tabs="true" @changed="onTabChanged">
      <Tab name="Basics" :label="t('harvester.virtualMachine.detail.tabs.basics')">
        <OverviewBasics v-if="contentResource" v-model="contentResource.spec.source" mode="view" :memory="memory" />
      </Tab>

      <Tab
        name="Volume"
        :label="t('harvester.tab.volume')"
        :weight="-1"
      >
        <Volume v-model="diskRows" :mode="mode" />
      </Tab>

      <Tab
        name="Network"
        :label="t('harvester.tab.network')"
        :weight="-2"
      >
        <Network v-model="networkRows" :mode="mode" />
      </Tab>

      <Tab name="keypairs" :label="t('harvester.virtualMachine.detail.tabs.keypairs')" class="bordered-table" :weight="-3">
        <OverviewKeypairs v-if="contentResource" v-model="contentResource.spec.source" />
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
