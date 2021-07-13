<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Checkbox from '@/components/form/Checkbox';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import VM_MIXIN from '@/mixins/vm';
import { _ADD } from '@/config/query-params';
import { HCI } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';

import SSHKey from '@/edit/kubevirt.io.virtualmachine/SSHKey';
import Volume from '@/edit/kubevirt.io.virtualmachine/volume';
import Network from '@/edit/kubevirt.io.virtualmachine/network';
import ImageSelect from '@/edit/kubevirt.io.virtualmachine/Image';
import CpuMemory from '@/edit/kubevirt.io.virtualmachine/CpuMemory';
import CloudConfig from '@/edit/kubevirt.io.virtualmachine/CloudConfig';

export default {
  name: 'EditVMTEMPLATE',

  components: {
    Volume,
    Network,
    CruResource,
    CpuMemory,
    ImageSelect,
    SSHKey,
    Checkbox,
    Tabbed,
    Tab,
    CloudConfig,
    NameNsDescription,
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
    return {
      templates:        [],
      versionName:      '',
      versionOption:    [],
      description:      '',
      templateVersion:  [],
      defaultVersion:   null,
      isDefaultVersion:  false,
      keyPairIds:       [],
      pageType:         'template'
    };
  },

  computed: {
    isAdd() {
      return this.$route.query.type === _ADD;
    },
    allTemplate() {
      return this.$store.getters['cluster/all'](HCI.VM_TEMPLATE);
    },
  },

  watch: {
    sshKey(neu) {
      const out = [];

      this.ssh.map( (I) => {
        if (neu.includes(I.metadata.name)) {
          const name = `${ I.metadata.namespace }/${ I.metadata.name }`;

          out.push(name);
        }
      });
      this.keyPairIds = out;
    }
  },

  mounted() {
    const imageName = this.diskRows[0].image || '';

    this.imageName = imageName;
  },

  methods: {
    async saveVMT(buttonCb) {
      await this.save(buttonCb);
    },

    updateCpuMemory(cpu, memory) {
      this.$set(this.spec.template.spec.domain.cpu, 'cores', cpu);
      this.$set(this, 'memory', memory);
    },

    onTabChanged({ tab }) {
      if (tab.name === 'advanced' && this.$refs.yamlEditor?.refresh) {
        this.$refs.yamlEditor.refresh();
      }
    },
  },
};
</script>

<template>
  <div>
    <div v-if="isView" class="mb-20"></div>
    <NameNsDescription
      v-if="!isView"
      v-model="value"
      :mode="mode"
      name-label="harvester.vmtemplatePage.nameNsDescription.name"
      :namespaced="false"
    />

    <CruResource
      :done-route="doneRoute"
      :resource="value"
      :mode="mode"
      :errors="errors"
      @apply-hooks="applyHooks"
      @finish="saveVMT"
    >
      <Tabbed :side-tabs="true" @changed="onTabChanged">
        <Tab name="Basics" :label="t('harvester.vmPage.detail.tabs.basics')">
          <CpuMemory :cpu="spec.template.spec.domain.cpu.cores" :mode="mode" :memory="memory" @updateCpuMemory="updateCpuMemory" />

          <div class="mb-20">
            <ImageSelect v-model="imageName" :disk-rows="diskRows" :mode="mode" :required="false" :disabled="!isCreate" />
          </div>

          <div class="mb-20">
            <SSHKey v-model="sshKey" :mode="mode" @update:sshKey="updateSSHKey" />
          </div>
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

        <Tab
          name="advanced"
          :label="t('harvester.tab.advanced')"
          :weight="-3"
        >
          <CloudConfig ref="yamlEditor" :user-script="userScript" :mode="mode" :network-script="networkScript" @updateCloudConfig="updateCloudConfig" />

          <div class="spacer"></div>
          <Checkbox v-model="isUseMouseEnhancement" :mode="mode" class="check" type="checkbox" :label="t('harvester.vmPage.enableUsb')" />
        </Tab>
      </Tabbed>
    </CruResource>
  </div>
</template>
